import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

function gerarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const categorias = await query(
    "SELECT id, nome, slug, imagem_url, ativa, categoria_pai_id, criado_em FROM TAB_CATEGORIA ORDER BY nome"
  )
  return NextResponse.json(categorias)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome, imagemUrl, categoriaPaiId } = await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 })
  }

  const slug = gerarSlug(nome)

  const existente = await query("SELECT id FROM TAB_CATEGORIA WHERE slug = $1", [slug])
  if (existente.length > 0) {
    return NextResponse.json({ erro: "Já existe uma categoria com esse nome" }, { status: 409 })
  }

  const [categoria] = await query(
    "INSERT INTO TAB_CATEGORIA (nome, slug, imagem_url, categoria_pai_id) VALUES ($1, $2, $3, $4) RETURNING id, nome, slug, imagem_url, ativa, categoria_pai_id, criado_em",
    [nome.trim(), slug, imagemUrl || null, categoriaPaiId || null]
  )

  revalidatePath("/", "layout")

  return NextResponse.json(categoria, { status: 201 })
}
