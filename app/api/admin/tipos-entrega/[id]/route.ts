import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, ativo } = await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome e obrigatorio" }, { status: 400 })
  }

  try {
    const [tipo] = await query(
      "UPDATE TAB_TIPO_ENTREGA SET nome = $1, ativo = $2 WHERE id = $3 RETURNING id, nome, ativo, criado_em",
      [nome.trim(), ativo ?? true, id]
    )
    if (!tipo) {
      return NextResponse.json({ erro: "Tipo de entrega nao encontrado" }, { status: 404 })
    }
    return NextResponse.json(tipo)
  } catch (erro) {
    if (erro instanceof Error && "code" in erro && erro.code === "23505") {
      return NextResponse.json({ erro: "Ja existe um tipo de entrega com esse nome" }, { status: 409 })
    }
    throw erro
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  await query("DELETE FROM TAB_TIPO_ENTREGA WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
