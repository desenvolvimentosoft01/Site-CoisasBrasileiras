import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { aprovado } = await request.json()

  const [avaliacao] = await query(
    "UPDATE TAB_AVALIACAO_PRODUTO SET aprovado = $1 WHERE id = $2 RETURNING id, aprovado",
    [Boolean(aprovado), id]
  )

  if (!avaliacao) {
    return NextResponse.json({ erro: "Avaliacao nao encontrada" }, { status: 404 })
  }

  revalidatePath("/", "layout")
  return NextResponse.json(avaliacao)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  await query("DELETE FROM TAB_AVALIACAO_PRODUTO WHERE id = $1", [id])

  revalidatePath("/", "layout")
  return NextResponse.json({ sucesso: true })
}
