import { query } from "@/lib/db"
import { DashboardConteudo, type Indicadores } from "@/components/admin/dashboard-conteudo"

async function buscarIndicadores(marca: "colorido" | "branco" | null): Promise<Indicadores> {
  const filtroP = marca ? "AND marca = $1" : ""
  const params = marca ? [marca] : []

  const [
    [{ count: produtosAtivos }],
    [{ count: pedidosHoje }],
    [{ soma: faturamentoMes }],
    [{ count: pedidosPendentes }],
    [{ count: vendasBalcaoHoje, soma: faturamentoBalcaoHoje }],
    produtosEstoqueBaixo,
    pedidosRecentes,
  ] = await Promise.all([
    query(`SELECT COUNT(*) FROM TAB_PRODUTO WHERE ativo = true ${filtroP}`, params),
    query(`SELECT COUNT(*) FROM TAB_PEDIDO WHERE criado_em::date = CURRENT_DATE ${filtroP}`, params),
    query(
      `SELECT COALESCE(SUM(total), 0) AS soma FROM TAB_PEDIDO
       WHERE status = 'pago' AND date_trunc('month', criado_em) = date_trunc('month', CURRENT_DATE) ${filtroP}`,
      params
    ),
    query(`SELECT COUNT(*) FROM TAB_PEDIDO WHERE status = 'aguardando_pagamento' ${filtroP}`, params),
    query(
      `SELECT COUNT(*), COALESCE(SUM(total), 0) AS soma FROM TAB_PEDIDO
       WHERE origem = 'balcao' AND criado_em::date = CURRENT_DATE ${filtroP}`,
      params
    ),
    query(
      `SELECT id, nome, estoque, estoque_minimo FROM TAB_PRODUTO
       WHERE ativo = true AND estoque <= estoque_minimo ${filtroP}
       ORDER BY estoque LIMIT 5`,
      params
    ),
    query(
      `SELECT p.id, p.status, p.total, p.origem, p.canal, p.forma_pagamento, p.criado_em,
         COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente balcão') AS cliente_nome
       FROM TAB_PEDIDO p LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
       WHERE 1 = 1 ${marca ? "AND p.marca = $1" : ""}
       ORDER BY p.criado_em DESC LIMIT 5`,
      params
    ),
  ])

  return {
    produtosAtivos: Number(produtosAtivos),
    pedidosHoje: Number(pedidosHoje),
    faturamentoMes,
    pedidosPendentes: Number(pedidosPendentes),
    vendasBalcaoHoje: Number(vendasBalcaoHoje),
    faturamentoBalcaoHoje,
    produtosEstoqueBaixo,
    pedidosRecentes,
  }
}

export default async function DashboardPage() {
  const [todas, colorido, branco] = await Promise.all([
    buscarIndicadores(null),
    buscarIndicadores("colorido"),
    buscarIndicadores("branco"),
  ])

  return <DashboardConteudo todas={todas} colorido={colorido} branco={branco} />
}
