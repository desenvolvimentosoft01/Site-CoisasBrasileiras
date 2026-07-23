import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const contas = await query(
    `SELECT id, tipo, descricao, valor, vencimento, pago, pago_em, categoria, observacao, criado_em
     FROM TAB_CONTA
     ORDER BY pago ASC, vencimento ASC`
  )
  return NextResponse.json(contas)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { tipo, descricao, valor, vencimento, categoria, observacao } = await request.json()

  if (tipo !== "pagar" && tipo !== "receber") {
    return NextResponse.json({ erro: "Tipo invalido" }, { status: 400 })
  }
  if (!descricao?.trim() || !valor || !vencimento) {
    return NextResponse.json({ erro: "Descricao, valor e vencimento sao obrigatorios" }, { status: 400 })
  }

  const [conta] = await query(
    `INSERT INTO TAB_CONTA (tipo, descricao, valor, vencimento, categoria, observacao)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, tipo, descricao, valor, vencimento, pago, pago_em, categoria, observacao, criado_em`,
    [tipo, descricao.trim(), valor, vencimento, categoria || null, observacao || null]
  )

  return NextResponse.json(conta, { status: 201 })
}
