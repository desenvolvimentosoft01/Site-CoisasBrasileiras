import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, texto, imagemUrl, nota, ordem, ativo } = await request.json()

  if (!nome || !nome.trim() || !texto || !texto.trim()) {
    return NextResponse.json({ erro: "Nome e texto sao obrigatorios" }, { status: 400 })
  }

  const [feedback] = await query(
    `UPDATE TAB_FEEDBACK
     SET nome = $1, texto = $2, imagem_url = $3, nota = $4, ordem = $5, ativo = $6
     WHERE id = $7
     RETURNING *`,
    [nome.trim(), texto.trim(), imagemUrl || null, nota || 5, ordem || 0, ativo ?? true, id]
  )

  if (!feedback) {
    return NextResponse.json({ erro: "Feedback nao encontrado" }, { status: 404 })
  }

  revalidatePath("/", "layout")

  return NextResponse.json(feedback)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  await query("DELETE FROM TAB_FEEDBACK WHERE id = $1", [id])

  revalidatePath("/", "layout")

  return NextResponse.json({ sucesso: true })
}
