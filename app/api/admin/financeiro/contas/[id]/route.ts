import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { tipo, descricao, valor, vencimento, pago, categoria, observacao } = await request.json()

  if (tipo !== "pagar" && tipo !== "receber") {
    return NextResponse.json({ erro: "Tipo invalido" }, { status: 400 })
  }
  if (!descricao?.trim() || !valor || !vencimento) {
    return NextResponse.json({ erro: "Descricao, valor e vencimento sao obrigatorios" }, { status: 400 })
  }

  const [conta] = await query(
    `UPDATE TAB_CONTA
     SET tipo = $1, descricao = $2, valor = $3, vencimento = $4, categoria = $5, observacao = $6,
         pago = $7, pago_em = CASE WHEN $7 AND NOT pago THEN NOW() WHEN NOT $7 THEN NULL ELSE pago_em END
     WHERE id = $8
     RETURNING id, tipo, descricao, valor, vencimento, pago, pago_em, categoria, observacao, criado_em`,
    [tipo, descricao.trim(), valor, vencimento, categoria || null, observacao || null, pago ?? false, id]
  )

  if (!conta) {
    return NextResponse.json({ erro: "Conta nao encontrada" }, { status: 404 })
  }

  return NextResponse.json(conta)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  await query("DELETE FROM TAB_CONTA WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
