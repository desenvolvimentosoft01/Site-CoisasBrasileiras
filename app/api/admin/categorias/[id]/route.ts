import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, ativa, imagemUrl } = await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome e obrigatorio" }, { status: 400 })
  }

  const [categoria] = await query(
    "UPDATE TAB_CATEGORIA SET nome = $1, ativa = $2, imagem_url = $3 WHERE id = $4 RETURNING id, nome, slug, imagem_url, ativa, criado_em",
    [nome.trim(), ativa ?? true, imagemUrl || null, id]
  )

  if (!categoria) {
    return NextResponse.json({ erro: "Categoria nao encontrada" }, { status: 404 })
  }

  revalidatePath("/", "layout")

  return NextResponse.json(categoria)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  await query("DELETE FROM TAB_CATEGORIA WHERE id = $1", [id])

  revalidatePath("/", "layout")

  return NextResponse.json({ sucesso: true })
}
