import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { legenda, ordem } = await request.json()

  const [midia] = await query(
    `UPDATE TAB_SOBRE_NOS_MIDIA SET legenda = $1, ordem = $2 WHERE id = $3 RETURNING *`,
    [legenda || null, ordem || 0, id]
  )

  if (!midia) {
    return NextResponse.json({ erro: "Midia nao encontrada" }, { status: 404 })
  }

  revalidatePath("/", "layout")

  return NextResponse.json(midia)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  await query("DELETE FROM TAB_SOBRE_NOS_MIDIA WHERE id = $1", [id])

  revalidatePath("/", "layout")

  return NextResponse.json({ sucesso: true })
}
