import { query } from "@/lib/db"
import { ProdutoForm } from "@/components/admin/produto-form"
import { notFound } from "next/navigation"

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [produto] = await query("SELECT * FROM TAB_PRODUTO WHERE id = $1", [id])
  if (!produto) notFound()

  const categorias = await query(
    "SELECT categoria_id FROM TAB_PRODUTO_CATEGORIA WHERE produto_id = $1",
    [id]
  )
  const imagens = await query(
    "SELECT id, url, ordem FROM TAB_PRODUTO_IMAGEM WHERE produto_id = $1 ORDER BY ordem",
    [id]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar produto</h1>
      <ProdutoForm
        produto={{
          ...produto,
          categoriaIds: categorias.map((c) => c.categoria_id),
          imagens,
        }}
      />
    </div>
  )
}
