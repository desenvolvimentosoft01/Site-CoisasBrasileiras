import { query } from "@/lib/db"
import { VendaBalcaoConteudo } from "@/components/admin/venda-balcao-conteudo"

export default async function VendaBalcaoPage() {
  const [produtos, clientes] = await Promise.all([
    query(`
      SELECT
        p.id, p.nome, p.preco, p.preco_promocional, p.estoque,
        COALESCE(
          json_agg(DISTINCT c.nome) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS categorias,
        (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_url
      FROM TAB_PRODUTO p
      LEFT JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id
      LEFT JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id
      WHERE p.ativo = true
      GROUP BY p.id
      ORDER BY p.nome
    `),
    query("SELECT id, nome, email, telefone FROM TAB_CLIENTE ORDER BY nome"),
  ])

  return <VendaBalcaoConteudo produtosIniciais={produtos} clientesIniciais={clientes} />
}
