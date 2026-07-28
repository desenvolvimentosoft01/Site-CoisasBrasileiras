import { query } from "@/lib/db"
import { ReajustePrecosConteudo } from "@/components/admin/reajuste-precos-conteudo"

export default async function ReajustePrecosPage() {
  const [produtos, categorias] = await Promise.all([
    query(`
      SELECT
        p.id, p.nome, p.sku, p.preco, p.preco_promocional, p.custo, p.ativo,
        COALESCE(json_agg(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL), '[]') AS categoria_ids
      FROM TAB_PRODUTO p
      LEFT JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id
      LEFT JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id
      GROUP BY p.id
      ORDER BY p.nome
    `),
    query("SELECT id, nome FROM TAB_CATEGORIA ORDER BY nome"),
  ])

  return <ReajustePrecosConteudo produtosIniciais={produtos} categorias={categorias} />
}
