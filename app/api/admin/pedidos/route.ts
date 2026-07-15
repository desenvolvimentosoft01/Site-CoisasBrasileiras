import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const pedidos = await query(`
    SELECT p.id, p.status, p.total, p.criado_em, c.nome AS cliente_nome
    FROM TAB_PEDIDO p
    JOIN TAB_CLIENTE c ON c.id = p.cliente_id
    ORDER BY p.criado_em DESC
  `)

  return NextResponse.json(pedidos)
}
