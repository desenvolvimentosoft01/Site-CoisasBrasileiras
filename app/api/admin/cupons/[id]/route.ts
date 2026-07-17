import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { tipo, valor, valorMinimo, primeiraCompraApenas, validade, usoMaximo, ativo } =
    await request.json()

  const [cupom] = await query(
    `UPDATE TAB_CUPOM
     SET tipo = $1, valor = $2, valor_minimo = $3, primeira_compra_apenas = $4,
         validade = $5, uso_maximo = $6, ativo = $7
     WHERE id = $8
     RETURNING *`,
    [
      tipo || "percentual",
      valor,
      valorMinimo || 0,
      primeiraCompraApenas ?? false,
      validade || null,
      usoMaximo || null,
      ativo ?? true,
      id,
    ]
  )

  if (!cupom) {
    return NextResponse.json({ erro: "Cupom nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(cupom)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  await query("DELETE FROM TAB_CUPOM WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
