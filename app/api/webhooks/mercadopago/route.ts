import { transacao, query } from "@/lib/db"
import { getPaymentMP, rotuloFormaPagamentoMP } from "@/lib/mercadopago"
import { sincronizarAssinaturaClube } from "@/lib/clube"
import { enviarEmail, templatePedidoPago, templateNovoPedidoAdmin } from "@/lib/email"
import { getSegredo } from "@/lib/segredos"
import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"

const STATUS_MP_PARA_PEDIDO: Record<string, string> = {
  approved: "pago",
  rejected: "cancelado",
  cancelled: "cancelado",
}

// Valida o header x-signature que o Mercado Pago envia, provando que a
// notificacao realmente veio do MP (nao apenas um POST forjado por terceiros).
// O segredo vem do painel do MP > sua aplicacao > Webhooks > "Assinatura secreta".
// Se ainda nao foi configurado (ex: em dev local), pula a validacao.
async function assinaturaValida(request: Request, dataId: string): Promise<boolean> {
  const segredo = await getSegredo("mercadopago_webhook_secret")
  if (!segredo) return true

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
    const novoStatus = STATUS_MP_PARA_PEDIDO[pagamento.status ?? ""]

    if (pedidoId && novoStatus) {
      const transicionouParaPago = await transacao(async (q) => {
        // Trava a linha e confere o status atual antes de agir: o MP pode
        // reenviar a mesma notificacao varias vezes, e sem essa checagem o
        // estoque seria baixado de novo a cada reenvio.
        const [pedidoAtual] = await q("SELECT status FROM TAB_PEDIDO WHERE id = $1 FOR UPDATE", [
          pedidoId,
        ])
        if (!pedidoAtual || pedidoAtual.status === novoStatus) return false

        const formaPagamento = rotuloFormaPagamentoMP(pagamento.payment_type_id, pagamento.payment_method_id)
        await q(
          "UPDATE TAB_PEDIDO SET status = $1, forma_pagamento = $2, atualizado_em = NOW() WHERE id = $3",
          [novoStatus, formaPagamento, pedidoId]
        )

        const viroPago = novoStatus === "pago" && pedidoAtual.status !== "pago"

        // So baixa estoque na primeira vez que o pedido e confirmado como pago.
        if (viroPago) {
          const itens = await q(
            "SELECT produto_id, quantidade FROM TAB_PEDIDO_ITEM WHERE pedido_id = $1",
            [pedidoId]
          )
          for (const item of itens) {
            await q("UPDATE TAB_PRODUTO SET estoque = estoque - $1 WHERE id = $2", [
              item.quantidade,
              item.produto_id,
            ])
          }
        }

        return viroPago
      })

      if (transicionouParaPago) {
        const [pedido] = await query(
          `SELECT p.total, c.nome AS cliente_nome, c.email AS cliente_email
           FROM TAB_PEDIDO p JOIN TAB_CLIENTE c ON c.id = p.cliente_id
           WHERE p.id = $1`,
          [pedidoId]
        )
        const itens = await query(
          `SELECT pi.quantidade, pi.preco_unitario, pr.nome
           FROM TAB_PEDIDO_ITEM pi JOIN TAB_PRODUTO pr ON pr.id = pi.produto_id
           WHERE pi.pedido_id = $1`,
          [pedidoId]
        )
        const itensEmail = itens.map((i) => ({
          nome: i.nome,
          quantidade: i.quantidade,
          precoUnitario: Number(i.preco_unitario),
        }))

        enviarEmail({
          to: pedido.cliente_email,
          subject: "Pagamento confirmado - Coisas Brasileiras",
          html: templatePedidoPago({
            nomeCliente: pedido.cliente_nome,
            pedidoId,
            itens: itensEmail,
            total: Number(pedido.total),
          }),
        })

        // Sem e-mail pessoal fixo no codigo (projeto revendido pra outros
        // clientes) - cai pro proprio e-mail de envio configurado.
        const emailAdmin = (await getSegredo("email_notificacoes_admin")) || (await getSegredo("email_user"))
        if (emailAdmin) {
          enviarEmail({
            to: emailAdmin,
            subject: `Novo pedido pago - ${pedido.cliente_nome}`,
            html: templateNovoPedidoAdmin({
              nomeCliente: pedido.cliente_nome,
              emailCliente: pedido.cliente_email,
              pedidoId,
              itens: itensEmail,
              total: Number(pedido.total),
            }),
          })
        }
      }
    }
  } catch {
    // Se o pagamento nao for encontrado ou a API do MP falhar, apenas
    // confirmamos o recebimento - o MP vai reenviar a notificacao depois.
  }

  return NextResponse.json({ recebido: true })
}
