import { query } from "@/lib/db"
import { EstoqueConteudo } from "@/components/admin/estoque-conteudo"

export default async function EstoquePage() {
  // Produtos em baixa primeiro, depois por nome - o que precisa de atencao
  // fica no topo da lista.
  const produtos = await query(
    `SELECT id, nome, sku, estoque, estoque_minimo, ativo
     FROM TAB_PRODUTO
     ORDER BY (estoque <= estoque_minimo) DESC, nome`
  )

  return <EstoqueConteudo produtosIniciais={produtos} />
}
