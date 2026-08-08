import { query } from "@/lib/db"
import { RelatoriosConteudo } from "@/components/admin/relatorios-conteudo"

async function buscarRelatorio(marca: "colorido" | "branco" | null, inicioTs: string, fimTs: string) {
  const filtroPed = marca ? "AND marca = $3" : ""
  const filtroPedAlias = marca ? "AND ped.marca = $3" : ""
  const filtroProd = marca ? "AND marca = $1" : ""
  const params2 = marca ? [inicioTs, fimTs, marca] : [inicioTs, fimTs]
  const paramsProd = marca ? [marca] : []

  const [vendasPorDia, produtosMaisVendidos, [resumo], vendasPorOrigem, [resumoEstoque], produtosEmBaixa] =
    await Promise.all([
      query(
        `SELECT to_char(criado_em, 'YYYY-MM-DD') AS dia, SUM(total) AS total
       FROM TAB_PEDIDO
       WHERE status = 'pago' AND criado_em BETWEEN $1 AND $2 ${filtroPed}
       GROUP BY dia
       ORDER BY dia`,
        params2
      ),
      query(
        `SELECT p.nome, SUM(pi.quantidade) AS quantidade, SUM(pi.quantidade * pi.preco_unitario) AS faturamento
       FROM TAB_PEDIDO_ITEM pi
       JOIN TAB_PEDIDO ped ON ped.id = pi.pedido_id
       JOIN TAB_PRODUTO p ON p.id = pi.produto_id
       WHERE ped.status = 'pago' AND ped.criado_em BETWEEN $1 AND $2 ${filtroPedAlias}
       GROUP BY p.id, p.nome
       ORDER BY quantidade DESC`,
        params2
      ),
      query(
        `SELECT
         COUNT(*) AS total_pedidos,
         COALESCE(SUM(total), 0) AS faturamento_total,
         COALESCE(AVG(total), 0) AS ticket_medio
       FROM TAB_PEDIDO
       WHERE status = 'pago' AND criado_em BETWEEN $1 AND $2 ${filtroPed}`,
        params2
      ),
      query(
        `SELECT origem, COUNT(*) AS total_pedidos, COALESCE(SUM(total), 0) AS faturamento
       FROM TAB_PEDIDO
       WHERE status = 'pago' AND criado_em BETWEEN $1 AND $2 ${filtroPed}
       GROUP BY origem`,
        params2
      ),
      // Estoque nao tem "periodo" - e uma foto do momento atual, por isso essas
      // duas queries abaixo nao usam o filtro de data.
      query(
        `SELECT
         COUNT(*) AS total_produtos,
         COALESCE(SUM(estoque), 0) AS unidades_em_estoque,
         COALESCE(SUM(estoque * preco), 0) AS valor_em_estoque,
         COUNT(*) FILTER (WHERE estoque <= estoque_minimo) AS produtos_em_baixa
       FROM TAB_PRODUTO
       WHERE ativo = true ${filtroProd}`,
        paramsProd
      ),
      query(
        `SELECT id, nome, sku, estoque, estoque_minimo
       FROM TAB_PRODUTO
       WHERE ativo = true AND estoque <= estoque_minimo ${filtroProd}
       ORDER BY estoque
       LIMIT 20`,
        paramsProd
      ),
    ])

  return { vendasPorDia, produtosMaisVendidos, resumo, vendasPorOrigem, resumoEstoque, produtosEmBaixa }
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>
}) {
  const { inicio, fim } = await searchParams

  const hoje = new Date()
  const inicioDefault = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const fimDefault = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
  const inicioPeriodo = inicio || inicioDefault
  const fimPeriodo = fim || fimDefault
  const inicioTs = `${inicioPeriodo}T00:00:00`
  const fimTs = `${fimPeriodo}T23:59:59`

  const [dadosTodas, dadosColorido, dadosBranco, pedidosPeriodo, categorias] = await Promise.all([
    buscarRelatorio(null, inicioTs, fimTs),
    buscarRelatorio("colorido", inicioTs, fimTs),
    buscarRelatorio("branco", inicioTs, fimTs),
    // Lista de pedidos do periodo pra filtrar por canal/status/entrega/categoria/marca
    // no client (mesmo padrao do in-mente-gestao) - as categorias de cada
    // pedido vem agregadas via subquery pra nao duplicar linha por item.
    query(
      `SELECT
         p.id, p.status, p.total, p.origem, p.canal, p.marca, p.criado_em,
         COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente balcão') AS cliente_nome,
         te.nome AS tipo_entrega,
         COALESCE(
           (SELECT json_agg(DISTINCT cat.nome)
            FROM TAB_PEDIDO_ITEM pi
            JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = pi.produto_id
            JOIN TAB_CATEGORIA cat ON cat.id = pc.categoria_id
            WHERE pi.pedido_id = p.id),
           '[]'
         ) AS categorias
       FROM TAB_PEDIDO p
       LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
       LEFT JOIN TAB_TIPO_ENTREGA te ON te.id = p.tipo_entrega_id
       WHERE p.criado_em BETWEEN $1 AND $2
       ORDER BY p.criado_em DESC
       LIMIT 500`,
      [inicioTs, fimTs]
    ),
    query("SELECT id, nome, marca FROM TAB_CATEGORIA WHERE ativa = true ORDER BY nome"),
  ])

  return (
    <RelatoriosConteudo
      dados={{ todas: dadosTodas, colorido: dadosColorido, branco: dadosBranco }}
      pedidosPeriodo={pedidosPeriodo}
      categorias={categorias}
      inicioPeriodo={inicioPeriodo}
      fimPeriodo={fimPeriodo}
    />
  )
}
