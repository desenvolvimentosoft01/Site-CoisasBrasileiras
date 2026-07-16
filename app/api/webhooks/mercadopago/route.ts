import { query } from "@/lib/db"
import { paymentMP } from "@/lib/mercadopago"
import { NextResponse } from "next/server"

const STATUS_MP_PARA_PEDIDO: Record<string, string> = {
  approved: "pago",
  rejected: "cancelado",
  cancelled: "cancelado",
}

// O Mercado Pago chama esse endpoint quando o status de um pagamento muda.
// Nunca confiamos no corpo da notificacao por si so - sempre buscamos o
// pagamento direto na API do MP usando o id recebido, para confirmar que e
// legitimo antes de atualizar o pedido.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const paymentId = body?.data?.id

  if (body?.type !== "payment" || !paymentId) {
    return NextResponse.json({ recebido: true })
  }

  try {
    const pagamento = await paymentMP.get({ id: paymentId })
    const pedidoId = pagamento.external_reference
    const novoStatus = STATUS_MP_PARA_PEDIDO[pagamento.status ?? ""]

    if (pedidoId && novoStatus) {
      await query("UPDATE TAB_PEDIDO SET status = $1, atualizado_em = NOW() WHERE id = $2", [
        novoStatus,
        pedidoId,
      ])
    }
  } catch {
    // Se o pagamento nao for encontrado ou a API do MP falhar, apenas
    // confirmamos o recebimento - o MP vai reenviar a notificacao depois.
  }

  return NextResponse.json({ recebido: true })
}
