import { query } from "@/lib/db"
import { obterXmlNotaFiscalBling } from "@/lib/bling"
import { parseNfeParaDanfe } from "@/lib/nfe-xml"

// Central de notas fiscais: junta num lugar so as notas de ENTRADA
// (TAB_COMPRA, importadas por XML em Compras > Entrada de NF) e as de SAIDA
// (TAB_PEDIDO, emitidas pelo Bling), pro cliente imprimir o DANFE e baixar o
// XML de qualquer uma sem precisar abrir o Bling.
//
// As duas metades vivem em tabelas diferentes de proposito - uma e compra,
// outra e venda, e nada justifica fundir isso no banco. A uniao acontece so
// aqui, na leitura, que e onde o usuario de fato pensa "minhas notas".

export type TipoNota = "entrada" | "saida"

export type NotaFiscalListada = {
  id: string
  tipo: TipoNota
  numero: string | null
  serie: string | null
  chaveAcesso: string | null
  dataEmissao: string | null
  valorTotal: string | null
  // Fornecedor na entrada, cliente na saida - a tela mostra numa coluna so.
  participante: string | null
  temXml: boolean
}

export async function listarNotasFiscais(): Promise<NotaFiscalListada[]> {
  // Duas consultas em vez de um UNION: os campos tem nomes e semantica
  // diferentes nas duas tabelas, e o UNION so esconderia isso atras de uma
  // fila de apelidos. Sao dois SELECTs pequenos, indexados por data_emissao.
  const [entradas, saidas] = await Promise.all([
    query(
      `SELECT c.id, c.numero_nota, c.serie, c.chave_acesso, c.data_emissao,
              COALESCE(c.valor_total_nota, 0) AS valor_total,
              f.razao_social AS participante,
              (c.xml_nfe IS NOT NULL) AS tem_xml
       FROM TAB_COMPRA c
       JOIN TAB_FORNECEDOR f ON f.id = c.fornecedor_id
       ORDER BY c.data_emissao DESC NULLS LAST, c.criado_em DESC`
    ),
    query(
      `SELECT p.id, p.nfe_numero, p.nfe_serie, p.nfe_chave_acesso, p.nfe_data_emissao,
              p.total AS valor_total,
              COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente avulso') AS participante,
              (p.xml_nfe IS NOT NULL) AS tem_xml
       FROM TAB_PEDIDO p
       LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
       WHERE p.bling_nota_id IS NOT NULL AND p.bling_nota_cancelada_em IS NULL
       ORDER BY p.nfe_data_emissao DESC NULLS LAST, p.criado_em DESC`
    ),
  ])

  const lista: NotaFiscalListada[] = [
    ...entradas.map((linha) => ({
      id: String(linha.id),
      tipo: "entrada" as const,
      numero: linha.numero_nota ?? null,
      serie: linha.serie ?? null,
      chaveAcesso: linha.chave_acesso ?? null,
      dataEmissao: linha.data_emissao ? String(linha.data_emissao) : null,
      valorTotal: linha.valor_total !== null ? String(linha.valor_total) : null,
      participante: linha.participante ?? null,
      temXml: Boolean(linha.tem_xml),
    })),
    ...saidas.map((linha) => ({
      id: String(linha.id),
      tipo: "saida" as const,
      numero: linha.nfe_numero ?? null,
      serie: linha.nfe_serie ?? null,
      chaveAcesso: linha.nfe_chave_acesso ?? null,
      dataEmissao: linha.nfe_data_emissao ? String(linha.nfe_data_emissao) : null,
      valorTotal: linha.valor_total !== null ? String(linha.valor_total) : null,
      participante: linha.participante ?? null,
      temXml: Boolean(linha.tem_xml),
    })),
  ]

  // Nota sem data de emissao (saida cujo XML ainda nao foi baixado) vai pro
  // fim da lista em vez de pro topo - a ordem que interessa e cronologica.
  return lista.sort((a, b) => (b.dataEmissao ?? "").localeCompare(a.dataEmissao ?? ""))
}

// Devolve o XML da nota de saida do pedido, baixando do Bling na primeira vez
// e guardando no banco. As chamadas seguintes saem direto do banco: XML de
// nota autorizada e imutavel, entao rebaixar seria so gastar chamada de API
// (e deixar o cliente na mao se o Bling estiver fora do ar).
//
// Devolve null quando o pedido nao tem nota emitida ou quando ela ainda nao
// foi autorizada na Sefaz - quem chama decide a mensagem.
export async function garantirXmlNotaSaida(pedidoId: string): Promise<string | null> {
  const [pedido] = await query(
    "SELECT xml_nfe, bling_nota_id, bling_nota_cancelada_em FROM TAB_PEDIDO WHERE id = $1",
    [pedidoId]
  )

  if (!pedido) return null
  if (pedido.xml_nfe) return pedido.xml_nfe
  if (!pedido.bling_nota_id) return null

  const xml = await obterXmlNotaFiscalBling(pedido.bling_nota_id)
  if (!xml) return null

  // Guarda junto os campos de identificacao da nota. Se o XML vier ilegivel
  // por algum motivo, ainda assim vale guardar o arquivo - o documento e o
  // que importa; os campos da listagem sao conveniencia.
  let numero: string | null = null
  let serie: string | null = null
  let chaveAcesso: string | null = null
  let dataEmissao: string | null = null
  try {
    const dados = parseNfeParaDanfe(xml)
    numero = dados.numero || null
    serie = dados.serie || null
    chaveAcesso = dados.chaveAcesso
    dataEmissao = dados.dataEmissao
  } catch {
    // Segue guardando so o XML.
  }

  await query(
    `UPDATE TAB_PEDIDO
     SET xml_nfe = $1, nfe_numero = $2, nfe_serie = $3, nfe_chave_acesso = $4, nfe_data_emissao = $5
     WHERE id = $6`,
    [xml, numero, serie, chaveAcesso, dataEmissao, pedidoId]
  )

  return xml
}
