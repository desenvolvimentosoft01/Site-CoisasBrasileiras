import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { valor, prazoDias } = await request.json()

  if (!valor || Number(valor) <= 0) {
    return NextResponse.json({ erro: "Valor é obrigatório" }, { status: 400 })
  }

  const [faixa] = await query(
    `UPDATE TAB_FRETE_FAIXA SET valor = $1, prazo_dias = $2
     WHERE id = $3
     RETURNING id, regiao, peso_min_kg, peso_max_kg, valor, prazo_dias`,
    [valor, prazoDias || 7, id]
  )

  if (!faixa) {
    return NextResponse.json({ erro: "Faixa não encontrada" }, { status: 404 })
  }

  return NextResponse.json(faixa)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  await query("DELETE FROM TAB_FRETE_FAIXA WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
