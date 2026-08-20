import { query } from "@/lib/db"
import { ProdutosConteudo } from "@/components/admin/produtos-conteudo"

export default async function ProdutosPage() {
  const produtos = await query(`
    SELECT
      p.id, p.codigo, p.nome, p.slug, p.sku, p.preco, p.preco_promocional, p.estoque, p.estoque_minimo,
      p.ativo, p.marca, p.criado_em,
      COALESCE(
        json_agg(DISTINCT c.nome) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS categorias
    FROM TAB_PRODUTO p
    LEFT JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id
    LEFT JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id
    GROUP BY p.id
    ORDER BY p.criado_em DESC
  `)

  return <ProdutosConteudo produtosIniciais={produtos} />
}
