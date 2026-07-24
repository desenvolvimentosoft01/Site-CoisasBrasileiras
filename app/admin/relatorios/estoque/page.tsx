import { query } from "@/lib/db"
import { RelatorioEstoqueConteudo } from "@/components/admin/relatorio-estoque-conteudo"

export default async function RelatorioEstoquePage() {
  const produtos = await query(`
    SELECT
      p.id, p.nome, p.sku, p.preco, p.preco_promocional, p.estoque, p.estoque_minimo,
      COALESCE(
        json_agg(DISTINCT c.nome) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS categorias
    FROM TAB_PRODUTO p
    LEFT JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id
    LEFT JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id
    WHERE p.ativo = true
    GROUP BY p.id
    ORDER BY (p.estoque <= p.estoque_minimo) DESC, p.nome
  `)

  const categorias = await query("SELECT id, nome FROM TAB_CATEGORIA WHERE ativa = true ORDER BY nome")

  return <RelatorioEstoqueConteudo produtosIniciais={produtos} categorias={categorias} />
}
