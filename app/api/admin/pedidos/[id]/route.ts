import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { enviarEmail, templateStatusAtualizado } from "@/lib/email"
import { getPaymentRefundMP, mensagemErroMercadoPago } from "@/lib/mercadopago"
import { NextResponse } from "next/server"

const STATUS_VALIDOS = [
  "aguardando_pagamento",
  "pago",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
]

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  // LEFT JOIN porque venda balcao pode nao ter cliente com conta no site nem
  // endereco de entrega vinculados - usa os dados avulsos digitados na venda.
  const [pedido] = await query(
    `
    SELECT
      p.id, p.status, p.total, p.forma_pagamento, p.nota_fiscal_url, p.criado_em, p.origem, p.canal,
      p.codigo_rastreio, p.transportadora,
      p.bling_nota_id, p.bling_link_danfe, p.bling_link_pdf, p.bling_nota_cancelada_em, p.bling_pedido_id,
      p.bling_nota_email_enviada_em, p.nota_fiscal_whatsapp_enviada_em,
      p.bling_nota_situacao, p.bling_nota_situacao_atualizada_em,
      COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente avulso') AS cliente_nome,
      c.email AS cliente_email,
      COALESCE(c.telefone, p.cliente_telefone_avulso) AS cliente_telefone,
      e.cep, e.logradouro, e.numero, e.complemento, e.bairro, e.cidade, e.estado
    FROM TAB_PEDIDO p
    LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
    LEFT JOIN TAB_ENDERECO e ON e.id = p.endereco_id
    WHERE p.id = $1
    `,
    [id]
  )

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 })
  }

  const itens = await query(
    `SELECT pi.quantidade, pi.preco_unitario, pr.nome AS produto_nome
     FROM TAB_PEDIDO_ITEM pi
     JOIN TAB_PRODUTO pr ON pr.id = pi.produto_id
     WHERE pi.pedido_id = $1`,
    [id]
  )

  return NextResponse.json({ ...pedido, itens })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { status, codigoRastreio, transportadora } = await request.json()

  if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ erro: "Status inválido" }, { status: 400 })
  }
  // "Pago" so pode ser definido automaticamente pelo webhook do Mercado
  // Pago (confirmacao real de pagamento) - nunca manualmente pelo admin,
  // que poderia liberar um pedido sem o pagamento ter de fato entrado.
  if (status === "pago") {
    return NextResponse.json(
      { erro: "Status 'Pago' é definido automaticamente pela confirmação do Mercado Pago e não pode ser alterado manualmente" },
      { status: 400 }
    )
  }

  // Cancelar um pedido ja pago precisa estornar o dinheiro de verdade no
  // Mercado Pago antes de mudar o status - senao o cliente fica cobrado sem
  // nenhum aviso. So tenta se houver payment_id salvo (pedidos confirmados
  // antes dessa funcionalidade nao tem); sem ele, cancela mesmo assim mas
  // sinaliza pro admin que o estorno precisa ser feito manualmente.
  let estornoAutomatico = false
  let avisoEstornoManual = false
  if (status === "cancelado") {
    const [pedidoAtual] = await query(
      "SELECT status, mercadopago_payment_id FROM TAB_PEDIDO WHERE id = $1",
      [id]
    )
    if (pedidoAtual?.status === "pago") {
      if (!pedidoAtual.mercadopago_payment_id) {
        avisoEstornoManual = true
      } else {
        try {
          const paymentRefund = await getPaymentRefundMP()
          await paymentRefund.total({
            payment_id: pedidoAtual.mercadopago_payment_id,
            // O MP exige uma chave de idempotencia por tentativa de estorno -
            // sem ela, um retry de rede poderia tentar estornar duas vezes.
            requestOptions: { idempotencyKey: `refund-${id}-${Date.now()}` },
          })
          estornoAutomatico = true
        } catch (erroEstorno) {
          return NextResponse.json(
            {
              erro: mensagemErroMercadoPago(
                erroEstorno,
                "Não foi possível estornar o pagamento no Mercado Pago. O pedido não foi cancelado - tente novamente ou estorne manualmente pelo painel do Mercado Pago."
              ),
            },
            { status: 502 }
          )
        }
      }
    }
  }

  // Monta o SET dinamicamente para permitir atualizar so o status, so o
  // rastreio, ou os dois juntos, sem precisar de duas rotas separadas.
  const campos: string[] = []
  const valores: unknown[] = []

  if (status !== undefined) {
    valores.push(status)
    campos.push(`status = $${valores.length}`)
  }
  if (codigoRastreio !== undefined) {
    valores.push(codigoRastreio || null)
    campos.push(`codigo_rastreio = $${valores.length}`)
  }
  if (transportadora !== undefined) {
    valores.push(transportadora || null)
    campos.push(`transportadora = $${valores.length}`)
  }

  if (campos.length === 0) {
    return NextResponse.json({ erro: "Nenhum campo para atualizar" }, { status: 400 })
  }

  valores.push(id)

  const [pedido] = await query(
    `UPDATE TAB_PEDIDO SET ${campos.join(", ")}, atualizado_em = NOW()
     WHERE id = $${valores.length}
     RETURNING id, status, codigo_rastreio, transportadora`,
    valores
  )

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 })
  }

  // Notifica o cliente por email sempre que o status muda manualmente pelo
  // admin (exceto "pago", que ja tem email proprio disparado pelo webhook do
  // MP) OU quando o rastreio e salvo/atualizado, mesmo sem trocar o status -
  // antes o cliente nao ficava sabendo se o admin so preenchesse o rastreio.
  const statusMudou = status !== undefined && status !== "pago"
  const rastreioMudou = codigoRastreio !== undefined && status === undefined
  if (statusMudou || rastreioMudou) {
    // LEFT JOIN de proposito - pedido de Venda Balcao pode nao ter
    // cliente_id (cliente avulso), e o INNER JOIN anterior fazia esses
    // pedidos sumirem da busca e o email ser pulado sem nenhum aviso.
    const [cliente] = await query(
      `SELECT c.nome, c.email FROM TAB_PEDIDO p LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id WHERE p.id = $1`,
      [id]
    )
    if (!cliente?.email) {
      console.warn(`[pedidos] Pedido ${id}: sem cliente com email cadastrado - notificacao de rastreio/status pulada`)
    } else {
      enviarEmail({
        to: cliente.email,
        subject: "Atualizacao do seu pedido - Coisas Brasileiras",
        html: templateStatusAtualizado({
          nomeCliente: cliente.nome,
          pedidoId: pedido.id,
          status: pedido.status,
          codigoRastreio: pedido.codigo_rastreio,
          transportadora: pedido.transportadora,
          estornoAutomatico,
        }),
      })
    }
  }

  return NextResponse.json({
    ...pedido,
    avisoEstornoManual: avisoEstornoManual || undefined,
  })
}
