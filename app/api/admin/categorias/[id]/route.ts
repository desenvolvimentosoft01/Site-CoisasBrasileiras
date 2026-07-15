import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, ativa } = await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome e obrigatorio" }, { status: 400 })
  }

  const [categoria] = await query(
    "UPDATE TAB_CATEGORIA SET nome = $1, ativa = $2 WHERE id = $3 RETURNING id, nome, slug, ativa, criado_em",
    [nome.trim(), ativa ?? true, id]
  )

  if (!categoria) {
    return NextResponse.json({ erro: "Categoria nao encontrada" }, { status: 404 })
  }

  return NextResponse.json(categoria)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  await query("DELETE FROM TAB_CATEGORIA WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
