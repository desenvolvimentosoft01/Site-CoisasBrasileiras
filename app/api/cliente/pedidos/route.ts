import { query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  // So pedidos feitos pelo proprio cliente no site - uma venda balcao vinculada
  // a esse cliente (cadastrado pelo admin) nao deve aparecer na conta dele.
  const pedidos = await query(
    `SELECT id, status, total, codigo_rastreio, transportadora, criado_em
     FROM TAB_PEDIDO
     WHERE cliente_id = $1 AND origem = 'site'
     ORDER BY criado_em DESC`,
    [sessaoOuErro.id]
  )

  return NextResponse.json(pedidos)
}
