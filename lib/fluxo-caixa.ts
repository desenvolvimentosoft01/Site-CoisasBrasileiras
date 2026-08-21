import { query } from "@/lib/db"
import type { MovimentoCaixa, PrevisaoDia, ResumoCaixa } from "@/lib/fluxo-caixa-tipos"

export type { MovimentoCaixa, ResumoCaixa, DiaCaixa, PrevisaoDia } from "@/lib/fluxo-caixa-tipos"

// Fluxo de caixa: dinheiro que ENTROU e SAIU de verdade, por data.
//
// Não é uma tabela nova de propósito. Caixa é leitura, não cadastro - todo
// movimento já existe em algum lugar (venda paga, conta quitada), e duplicar
// isso numa tabela própria criaria duas versões do mesmo fato, que uma hora
// discordam entre si. Aqui é só a soma das origens que já temos:
//
//   entrada  = venda paga (TAB_PEDIDO)          + conta a receber quitada
//   saída    = conta a pagar quitada (TAB_CONTA, inclui as geradas por compra)
//
// A data é a do dinheiro, não a do documento: `pago_em` da venda (migration
// 064) e `pago_em` da conta. Conta em aberto NÃO entra - ela é previsão, e
// misturar previsão com realizado é o jeito mais rápido de achar que tem
// dinheiro que ainda não entrou.

// Mesmo SELECT usado pelos movimentos e pelos totais - duas consultas com
// regra escrita duas vezes acabam divergindo na primeira manutenção.
const MOVIMENTOS = `
  SELECT p.pago_em::date AS data, 'entrada' AS tipo, 'venda' AS origem,
         'Venda ' || CASE WHEN p.origem = 'balcao' THEN 'balcão' ELSE 'site' END
           || ' - ' || COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente avulso') AS descricao,
         p.origem AS categoria, p.total AS valor
  FROM TAB_PEDIDO p
  LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
  WHERE p.status = 'pago' AND p.pago_em IS NOT NULL

  UNION ALL

  SELECT co.pago_em::date AS data,
         CASE WHEN co.tipo = 'receber' THEN 'entrada' ELSE 'saida' END AS tipo,
         'conta' AS origem, co.descricao, co.categoria, co.valor
  FROM TAB_CONTA co
  WHERE co.pago = true AND co.pago_em IS NOT NULL
`

function formatarData(valor: unknown): string {
  if (!(valor instanceof Date)) return String(valor).slice(0, 10)
  const mes = String(valor.getMonth() + 1).padStart(2, "0")
  const dia = String(valor.getDate()).padStart(2, "0")
  return `${valor.getFullYear()}-${mes}-${dia}`
}

export async function listarMovimentosCaixa(
  dataInicial: string,
  dataFinal: string
): Promise<MovimentoCaixa[]> {
  const linhas = await query(
    `SELECT * FROM (${MOVIMENTOS}) m
     WHERE m.data BETWEEN $1 AND $2
     ORDER BY m.data DESC, m.tipo, m.descricao`,
    [dataInicial, dataFinal]
  )

  return linhas.map((linha) => ({
    // O pg devolve DATE como Date na meia-noite LOCAL. toISOString() converte
    // pra UTC e, dependendo do fuso, joga o movimento pro dia anterior - o que
    // num caixa significa venda aparecendo no dia errado.
    data: formatarData(linha.data),
    tipo: linha.tipo,
    origem: linha.origem,
    descricao: linha.descricao,
    categoria: linha.categoria,
    valor: Number(linha.valor),
  }))
}

export async function resumoCaixa(dataInicial: string, dataFinal: string): Promise<ResumoCaixa> {
  const [[periodo], [anterior]] = await Promise.all([
    query(
      `SELECT
         COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS entradas,
         COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS saidas
       FROM (${MOVIMENTOS}) m
       WHERE m.data BETWEEN $1 AND $2`,
      [dataInicial, dataFinal]
    ),
    // Saldo anterior: tudo que aconteceu ANTES do período escolhido. Sem isso
    // o caixa de um mês começaria do zero, como se a loja tivesse nascido no
    // dia 1 - e o saldo do fim do mês não bateria com o dinheiro real.
    query(
      `SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) AS saldo
       FROM (${MOVIMENTOS}) m
       WHERE m.data < $1`,
      [dataInicial]
    ),
  ])

  const entradas = Number(periodo.entradas)
  const saidas = Number(periodo.saidas)
  const saldoAnterior = Number(anterior.saldo)

  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
    saldoAnterior,
    saldoAcumulado: saldoAnterior + entradas - saidas,
  }
}


// Projecao de saldo: parte do saldo real de HOJE e vai somando o que vence
// nos proximos dias. Responde "vou ter dinheiro no dia 20?", que e a pergunta
// que faz alguem abrir essa tela.
//
// Conta vencida e nao paga entra no primeiro dia da projecao, marcada como
// atrasada: ela nao deixou de existir por ter passado da data, e joga-la no
// passado esconderia o buraco que ela representa no saldo de hoje.
export async function projecaoCaixa(diasAFrente = 30): Promise<PrevisaoDia[]> {
  const linhas = await query(
    `SELECT
       GREATEST(vencimento, CURRENT_DATE) AS data,
       BOOL_OR(vencimento < CURRENT_DATE) AS atrasado,
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'receber'), 0) AS a_receber,
       COALESCE(SUM(valor) FILTER (WHERE tipo = 'pagar'), 0) AS a_pagar
     FROM TAB_CONTA
     WHERE pago = false AND vencimento <= CURRENT_DATE + ($1 || ' days')::interval
     GROUP BY GREATEST(vencimento, CURRENT_DATE)
     ORDER BY 1`,
    [diasAFrente]
  )

  // Saldo de partida: o caixa real acumulado ate hoje. Sem isso a projecao
  // comecaria do zero e nao diria nada sobre ter ou nao dinheiro no dia.
  const [{ saldo }] = await query(
    `SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) AS saldo
     FROM (${MOVIMENTOS}) m
     WHERE m.data <= CURRENT_DATE`
  )

  let acumulado = Number(saldo)
  return linhas.map((linha) => {
    const aReceber = Number(linha.a_receber)
    const aPagar = Number(linha.a_pagar)
    acumulado += aReceber - aPagar
    return {
      data: formatarData(linha.data),
      aReceber,
      aPagar,
      saldoProjetado: acumulado,
      atrasado: Boolean(linha.atrasado),
    }
  })
}
