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
    "SELECT id, nome, slug, ativa, criado_em FROM TAB_CATEGORIA ORDER BY nome"
  )
  return NextResponse.json(categorias)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome } = await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome e obrigatorio" }, { status: 400 })
  }

  const slug = gerarSlug(nome)

  const existente = await query("SELECT id FROM TAB_CATEGORIA WHERE slug = $1", [slug])
  if (existente.length > 0) {
    return NextResponse.json({ erro: "Ja existe uma categoria com esse nome" }, { status: 409 })
  }

  const [categoria] = await query(
    "INSERT INTO TAB_CATEGORIA (nome, slug) VALUES ($1, $2) RETURNING id, nome, slug, ativa, criado_em",
    [nome.trim(), slug]
  )

  revalidatePath("/", "layout")

  return NextResponse.json(categoria, { status: 201 })
}
