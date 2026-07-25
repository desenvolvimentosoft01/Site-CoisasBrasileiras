import { query } from "@/lib/db"
import { CategoriasConteudo } from "@/components/admin/categorias-conteudo"

export default async function CategoriasPage() {
  const categorias = await query(
    "SELECT id, nome, slug, imagem_url, ativa, categoria_pai_id, criado_em FROM TAB_CATEGORIA ORDER BY nome"
  )

  return <CategoriasConteudo categoriasIniciais={categorias} />
}
