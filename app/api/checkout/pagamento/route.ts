import { query, transacao } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { getPaymentMP, mensagemErroMercadoPago, codigoFormaPagamentoMP } from "@/lib/mercadopago"
import { confirmarPedidoPago } from "@/lib/pedido-pago"
import { NextResponse } from "next/server"

// Formato que o Payment Brick devolve no onSubmit - varia por metodo (cartao
// manda token/issuer_id/installments, Pix so manda payment_method_id/payer).
type FormDataBrick = {
  token?: string
  issuer_id?: string
  payment_method_id: string
  installments?: number
  payer: {
    email: string
    identification?: { type: string; number: string }
  }
}

// Segundo passo do checkout transparente: o Payment Brick roda inteiramente
// na tela do site (cartao e tokenizado no navegador do cliente, nunca passa
// pelo nosso servidor) e chama esse endpoint so com o token/metodo escolhido.
// Aqui criamos o pagamento de fato na API do Mercado Pago.
export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro
  const cliente = sessaoOuErro

  const { pedidoId, formData } = (await request.json()) as {
    pedidoId: string
    formData: FormDataBrick
  }

  if (!pedidoId || !formData?.payment_method_id) {
    return NextResponse.json({ erro: "Dados de pagamento incompletos" }, { status: 400 })
  }

  // O pedido (e o total a cobrar) e sempre buscado do banco, nunca aceito do
  // client - o Brick so escolhe COMO pagar, nunca QUANTO. A troca pra
  // "processando_pagamento" acontece com FOR UPDATE dentro da transacao pra
  // travar a linha - sem isso, um duplo clique ou reenvio da mesma tela
  // conseguiria passar pela checagem de status duas vezes e criar dois
  // pagamentos (duas cobranças) no Mercado Pago pro mesmo pedido.
  const pedido = await transacao(async (q) => {
    const [linha] = await q(
      "SELECT id, total, status FROM TAB_PEDIDO WHERE id = $1 AND cliente_id = $2 FOR UPDATE",
      [pedidoId, cliente.id]
    )
    if (!linha || linha.status !== "aguardando_pagamento") return null
    await q("UPDATE TAB_PEDIDO SET status = 'processando_pagamento' WHERE id = $1", [linha.id])
    return linha
  })

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado ou já processado" }, { status: 409 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  // O Mercado Pago rejeita notification_url que nao seja uma URL publica
  // valida (localhost nunca e alcancavel por eles) - em dev local, omite o
  // campo em vez de travar a criacao do pagamento; o webhook so funciona
  // mesmo com o site publicado.
  const notificationUrl = siteUrl.startsWith("https://") ? `${siteUrl}/api/webhooks/mercadopago` : undefined

  try {
    const paymentMP = await getPaymentMP()
    const pagamento = await paymentMP.create({
      body: {
        transaction_amount: Number(pedido.total),
        token: formData.token,
        issuer_id: formData.issuer_id ? Number(formData.issuer_id) : undefined,
        payment_method_id: formData.payment_method_id,
        installments: formData.installments || 1,
        description: `Pedido ${pedido.id} - Coisas Brasileiras`,
        payer: formData.payer,
        external_reference: pedido.id,
        notification_url: notificationUrl,
      },
      requestOptions: {
        // O MP exige uma chave de idempotencia por tentativa de pagamento -
        // sem ela, um retry de rede poderia cobrar o cliente duas vezes.
        idempotencyKey: `${pedido.id}-${Date.now()}`,
      },
    })

    // Pagamento recusado na hora (cartao) - libera o pedido de volta pra
    // "aguardando_pagamento" pra o cliente poder tentar outro cartao/metodo
    // sem ficar travado no status intermediario. Aprovado ja confirma na
    // hora (a resposta vem direto da API do MP, nao do cliente - da pra
    // confiar nela tanto quanto no webhook, so chega mais rapido). Pendente
    // (Pix, boleto) fica em "processando_pagamento" ate o webhook confirmar.
    if (pagamento.status === "rejected") {
      await query("UPDATE TAB_PEDIDO SET status = 'aguardando_pagamento' WHERE id = $1", [pedido.id])
    } else if (pagamento.status === "approved") {
      const formaPagamento = codigoFormaPagamentoMP(pagamento.payment_type_id, pagamento.payment_method_id)
      await confirmarPedidoPago(pedido.id, formaPagamento, pagamento.id)
    }

    // O webhook continua sendo o "backup" pro caso da confirmacao sincrona
    // acima nao rolar (queda de rede entre a resposta do MP e esse UPDATE) -
    // por isso o handler dele so aplica update se o pedido nao estiver pago.
    return NextResponse.json({
      pedidoId: pedido.id,
      status: pagamento.status,
      statusDetail: pagamento.status_detail,
      // Dados do Pix (QR code) so vem quando payment_method_id === "pix".
      pix: pagamento.point_of_interaction?.transaction_data
        ? {
            qrCode: pagamento.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: pagamento.point_of_interaction.transaction_data.qr_code_base64,
          }
        : null,
    })
  } catch (erroGateway) {
    // Erro de infraestrutura (gateway fora do ar, token invalido) - devolve o
    // pedido pra "aguardando_pagamento" pra nao deixar travado sem nenhum
    // pagamento em andamento de verdade.
    await query("UPDATE TAB_PEDIDO SET status = 'aguardando_pagamento' WHERE id = $1", [pedido.id])
    console.error("[checkout/pagamento] Falha ao criar pagamento:", erroGateway)
    return NextResponse.json(
      { erro: mensagemErroMercadoPago(erroGateway, "Não foi possível processar o pagamento agora. Tente novamente.") },
      { status: 502 }
    )
  }
}
