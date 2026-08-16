import { transacao } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Cliente so pode cancelar pedido proprio que ainda nao foi pago - depois
// de "pago" pra frente, cancelamento passa a ser responsabilidade do
// admin (pode envolver estorno, nota fiscal ja emitida etc).
const STATUS_CANCELAVEIS = ["aguardando_pagamento", "processando_pagamento"]

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro
  const cliente = sessaoOuErro

  const { id } = await params

  const cancelado = await transacao(async (q) => {
    const [pedido] = await q(
      "SELECT id, status, cupom_id FROM TAB_PEDIDO WHERE id = $1 AND cliente_id = $2 FOR UPDATE",
      [id, cliente.id]
    )
    if (!pedido || !STATUS_CANCELAVEIS.includes(pedido.status)) return null

    await q("UPDATE TAB_PEDIDO SET status = 'cancelado' WHERE id = $1", [pedido.id])

    // Devolve o uso do cupom - o contador e incrementado na criacao do
    // pedido (antes do pagamento), entao um pedido cancelado nao pode
    // continuar contando contra o limite de uso do cliente/cupom.
    if (pedido.cupom_id) {
      await q("UPDATE TAB_CUPOM SET usos_atuais = GREATEST(usos_atuais - 1, 0) WHERE id = $1", [pedido.cupom_id])
    }

    return pedido
  })

  if (!cancelado) {
    return NextResponse.json(
      { erro: "Pedido não encontrado ou não pode mais ser cancelado" },
      { status: 409 }
    )
  }

  return NextResponse.json({ sucesso: true })
}
