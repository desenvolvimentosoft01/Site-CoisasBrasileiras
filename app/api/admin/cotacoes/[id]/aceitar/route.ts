import { transacao, query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
import { NextResponse } from "next/server"

// So aceita cotacao "respondida" (com quantidade/preco preenchidos pelo
// fornecedor) - gera um Pedido de Compra automaticamente com esses valores.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [cotacao] = await query(
    "SELECT id, status, fornecedor_id, observacao, desconto FROM TAB_COTACAO WHERE id = $1",
    [id]
  )
  if (!cotacao) {
    return NextResponse.json({ erro: "Cotação não encontrada" }, { status: 404 })
  }
  if (cotacao.status !== "respondida") {
    return NextResponse.json({ erro: "Só é possível aceitar uma cotação já respondida pelo fornecedor" }, { status: 400 })
  }

  const itens = await query(
    `SELECT produto_id, descricao, quantidade_cotada, valor_unitario_cotado
     FROM TAB_COTACAO_ITEM WHERE cotacao_id = $1`,
    [id]
  )

  const subtotal = itens.reduce(
    (soma, item) => soma + Number(item.quantidade_cotada) * Number(item.valor_unitario_cotado),
    0
  )
  const valorDesconto = Math.min(Number(cotacao.desconto) || 0, subtotal)
  const valorTotal = subtotal - valorDesconto

  const pedidoCompra = await transacao(async (executar) => {
    const [criado] = await executar(
      `INSERT INTO TAB_PEDIDO_COMPRA (fornecedor_id, observacao, valor_total, desconto)
       VALUES ($1, $2, $3, $4)
       RETURNING id, numero, status, valor_total, desconto, criado_em`,
      [cotacao.fornecedor_id, cotacao.observacao, valorTotal, valorDesconto]
    )

    for (const item of itens) {
      const quantidade = Number(item.quantidade_cotada)
      const custoUnitario = Number(item.valor_unitario_cotado)
      await executar(
        `INSERT INTO TAB_PEDIDO_COMPRA_ITEM
           (pedido_compra_id, produto_id, descricao, quantidade, custo_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [criado.id, item.produto_id, item.descricao, quantidade, custoUnitario, quantidade * custoUnitario]
      )
    }

    await executar(
      "UPDATE TAB_COTACAO SET status = 'aceita', pedido_compra_id = $1, atualizado_em = NOW() WHERE id = $2",
      [criado.id, id]
    )

    return criado
  })

  // Aceitar cotacao vira compromisso com o fornecedor pelo preco respondido -
  // fica registrado quem aceitou e por quanto.
  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Cotações",
    acao: "edicao",
    tabela: "TAB_COTACAO",
    registroId: id,
    antes: { status: cotacao.status },
    depois: {
      status: "aceita",
      pedido_compra_id: pedidoCompra.id,
      pedido_compra_numero: pedidoCompra.numero,
      valor_total: valorTotal,
    },
  })

  return NextResponse.json(pedidoCompra, { status: 201 })
}
