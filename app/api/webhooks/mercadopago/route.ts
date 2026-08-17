import { transacao } from "@/lib/db"
import { getPaymentMP, codigoFormaPagamentoMP } from "@/lib/mercadopago"
import { sincronizarAssinaturaClube } from "@/lib/clube"
import { confirmarPedidoPago } from "@/lib/pedido-pago"
import { getSegredo } from "@/lib/segredos"
import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"

const STATUS_MP_PARA_PEDIDO_NAO_PAGO: Record<string, string> = {
  rejected: "cancelado",
  cancelled: "cancelado",
}

// Valida o header x-signature que o Mercado Pago envia, provando que a
// notificacao realmente veio do MP (nao apenas um POST forjado por terceiros).
// O segredo vem do painel do MP > sua aplicacao > Webhooks > "Assinatura secreta".
// Obrigatorio - sem o segredo configurado, rejeita a notificacao (fail-closed)
// em vez de aceitar sem validar.
async function assinaturaValida(request: Request, dataId: string): Promise<boolean> {
  const segredo = await getSegredo("mercadopago_webhook_secret")
  if (!segredo) return false

  const signatureHeader = request.headers.get("x-signature")
  const requestId = request.headers.get("x-request-id")
  if (!signatureHeader || !requestId) return false

  const partes = Object.fromEntries(
    signatureHeader.split(",").map((parte) => parte.trim().split("=") as [string, string])
  )
  const { ts, v1: assinaturaRecebida } = partes
  if (!ts || !assinaturaRecebida) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const assinaturaEsperada = createHmac("sha256", segredo).update(manifest).digest("hex")

  const a = Buffer.from(assinaturaRecebida)
  const b = Buffer.from(assinaturaEsperada)
  return a.length === b.length && timingSafeEqual(a, b)
}

// O Mercado Pago chama esse endpoint quando o status de um pagamento muda.
// Nunca confiamos no corpo da notificacao por si so - sempre buscamos o
// pagamento direto na API do MP usando o id recebido, para confirmar que e
// legitimo antes de atualizar o pedido.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const dataId = body?.data?.id

  // Notificacao de assinatura do Clube (cobranca recorrente) - fluxo
  // separado do pagamento avulso de pedido, so atualiza TAB_ASSINATURA_CLUBE.
  if (body?.type === "subscription_preapproval" && dataId) {
    if (!(await assinaturaValida(request, String(dataId)))) {
      return NextResponse.json({ erro: "Assinatura inválida" }, { status: 401 })
    }
    try {
      await sincronizarAssinaturaClube(String(dataId))
    } catch {
      // Se a API do MP falhar, so confirma o recebimento - o MP reenvia depois.
    }
    return NextResponse.json({ recebido: true })
  }

  const paymentId = dataId

  if (body?.type !== "payment" || !paymentId) {
    return NextResponse.json({ recebido: true })
  }

  if (!(await assinaturaValida(request, String(paymentId)))) {
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 401 })
  }

  try {
    const paymentMP = await getPaymentMP()
    const pagamento = await paymentMP.get({ id: paymentId })
    const pedidoId = pagamento.external_reference
    const formaPagamento = codigoFormaPagamentoMP(pagamento.payment_type_id, pagamento.payment_method_id)

    if (pedidoId && pagamento.status === "approved") {
      // Idempotente - se o Payment Brick ja confirmou esse mesmo pagamento
      // na resposta sincrona (cartao aprovado na hora), essa chamada e um
      // no-op; serve de reforco pro caso da confirmacao sincrona nao ter
      // rolado, e e o unico caminho pra Pix/boleto (aprovados so depois,
      // de forma assincrona).
      await confirmarPedidoPago(pedidoId, formaPagamento, paymentId)
    } else if (pedidoId) {
      const novoStatus = STATUS_MP_PARA_PEDIDO_NAO_PAGO[pagamento.status ?? ""]
      if (novoStatus) {
        await transacao(async (q) => {
          // Trava a linha e confere o status atual antes de agir: o MP pode
          // reenviar a mesma notificacao varias vezes.
          const [pedidoAtual] = await q("SELECT status FROM TAB_PEDIDO WHERE id = $1 FOR UPDATE", [pedidoId])
          if (!pedidoAtual || pedidoAtual.status === novoStatus || pedidoAtual.status === "pago") return

          await q(
            "UPDATE TAB_PEDIDO SET status = $1, forma_pagamento = $2, atualizado_em = NOW() WHERE id = $3",
            [novoStatus, formaPagamento, pedidoId]
          )
        })
      }
    }
  } catch {
    // Se o pagamento nao for encontrado ou a API do MP falhar, apenas
    // confirmamos o recebimento - o MP vai reenviar a notificacao depois.
  }

  return NextResponse.json({ recebido: true })
}
