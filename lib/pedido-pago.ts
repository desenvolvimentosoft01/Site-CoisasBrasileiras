import { transacao, query } from "@/lib/db"
import { registrarMovimentoEstoque } from "@/lib/estoque-movimento"
import { enviarEmail, templatePedidoPago, templateNovoPedidoAdmin } from "@/lib/email"
import { getSegredo } from "@/lib/segredos"

// Confirma um pedido como pago - baixa estoque e dispara os e-mails de
// confirmacao. Chamado tanto pela resposta sincrona do Payment Brick (cartao
// aprovado na hora) quanto pelo webhook do Mercado Pago (Pix, boleto, ou
// como reforco caso a confirmacao sincrona nao tenha rolado por algum
// motivo) - por isso e idempotente: FOR UPDATE trava a linha e so age se o
// pedido ainda nao estiver "pago", senao dois caminhos confirmando o mesmo
// pagamento baixariam o estoque em dobro.
export async function confirmarPedidoPago(
  pedidoId: string,
  formaPagamento?: string | null,
  paymentId?: string | number | null
): Promise<void> {
  const virouPago = await transacao(async (q) => {
    const [pedidoAtual] = await q("SELECT status FROM TAB_PEDIDO WHERE id = $1 FOR UPDATE", [pedidoId])
    if (!pedidoAtual || pedidoAtual.status === "pago") return false

    // O payment_id fica salvo pra permitir estorno automatico se esse pedido
    // for cancelado depois de pago (ver app/api/admin/pedidos/[id]/route.ts).
    await q(
      "UPDATE TAB_PEDIDO SET status = 'pago', forma_pagamento = COALESCE($2, forma_pagamento), " +
        "mercadopago_payment_id = COALESCE($3, mercadopago_payment_id), atualizado_em = NOW() WHERE id = $1",
      [pedidoId, formaPagamento ?? null, paymentId != null ? String(paymentId) : null]
    )

    const itens = await q("SELECT produto_id, quantidade FROM TAB_PEDIDO_ITEM WHERE pedido_id = $1", [pedidoId])
    for (const item of itens) {
      // RETURNING traz o saldo ja atualizado: o kardex guarda o saldo DEPOIS
      // do movimento, e reler o produto numa segunda consulta abriria brecha
      // pra pegar um valor ja mexido por outra transacao.
      const [produto] = await q(
        "UPDATE TAB_PRODUTO SET estoque = estoque - $1 WHERE id = $2 RETURNING estoque",
        [item.quantidade, item.produto_id]
      )
      await registrarMovimentoEstoque(q, {
        produtoId: item.produto_id,
        quantidade: Number(item.quantidade),
        tipo: "saida",
        motivo: "venda",
        saldoApos: Number(produto?.estoque ?? 0),
        origemTipo: "pedido",
        origemId: pedidoId,
      })
    }

    return true
  })

  if (!virouPago) return

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
