import { query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const pedidos = await query(
    `SELECT id, status, total, codigo_rastreio, transportadora, criado_em
     FROM TAB_PEDIDO
     WHERE cliente_id = $1
     ORDER BY criado_em DESC`,
    [sessaoOuErro.id]
  )

  return NextResponse.json(pedidos)
}
