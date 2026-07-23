import { transacao, query } from "@/lib/db"
import { consultarCheckoutPagBank } from "@/lib/pagbank"
import { enviarEmail, templatePedidoPago, templateNovoPedidoAdmin } from "@/lib/email"
import { NextResponse } from "next/server"

const EMAIL_ADMIN = process.env.EMAIL_NOTIFICACOES_ADMIN || "email-removido@exemplo.com"

// Mapeia o status de charge do PagBank pro status interno do pedido. Charges
// "AUTHORIZED"/"WAITING" continuam como aguardando_pagamento (nao mexe).
const STATUS_PAGBANK_PARA_PEDIDO: Record<string, string> = {
  PAID: "pago",
  DECLINED: "cancelado",
  CANCELED: "cancelado",
}

// O PagBank chama esse endpoint quando o status de um checkout/cobranca muda.
// Assim como no webhook do Mercado Pago, nunca confiamos no corpo da
// notificacao por si so - o payload so serve pra saber "o id de que checkout
// mudou"; quem confirma o status de verdade e uma nova consulta na API do
// PagBank, autenticada com nosso token (Bearer), o que garante que a
// notificacao e legitima (um forjador nao consegue inventar um checkout
// nosso que retorne PAID nessa consulta).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  // O PagBank pode mandar o id do checkout em formatos diferentes conforme o
  // evento (id direto, ou aninhado em charges/checkout) - tenta os caminhos
  // mais comuns antes de desistir.
  const checkoutId: string | undefined =
    body?.id || body?.checkout?.id || body?.data?.id || body?.charges?.[0]?.id

  if (!checkoutId) {
    return NextResponse.json({ recebido: true })
  }

  try {
    const checkout = await consultarCheckoutPagBank(checkoutId)
    const pedidoId = checkout.reference_id

    const charges: Array<{ status?: string }> = checkout.charges || []
    const statusCharge = charges[charges.length - 1]?.status
    const novoStatus = statusCharge ? STATUS_PAGBANK_PARA_PEDIDO[statusCharge] : undefined

    if (pedidoId && novoStatus) {
      const transicionouParaPago = await transacao(async (q) => {
        // Trava a linha e confere o status atual antes de agir - o PagBank
        // pode reenviar a mesma notificacao varias vezes, e sem essa checagem
        // o estoque seria baixado de novo a cada reenvio.
        const [pedidoAtual] = await q(
          "SELECT status, gateway_pagamento FROM TAB_PEDIDO WHERE id = $1 FOR UPDATE",
          [pedidoId]
        )
        if (!pedidoAtual || pedidoAtual.gateway_pagamento !== "pagbank") return false
        if (pedidoAtual.status === novoStatus) return false

        await q("UPDATE TAB_PEDIDO SET status = $1, atualizado_em = NOW() WHERE id = $2", [
          novoStatus,
          pedidoId,
        ])

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

        enviarEmail({
          to: EMAIL_ADMIN,
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
  } catch {
    // Se o checkout nao for encontrado ou a API do PagBank falhar, apenas
    // confirmamos o recebimento - o PagBank reenvia a notificacao depois.
  }

  return NextResponse.json({ recebido: true })
}
