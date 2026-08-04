import { transacao, query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

type ItemPedidoCompra = {
  produtoId?: string | null
  descricao: string
  quantidade: number
  custoUnitario: number
}

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const pedidos = await query(
    `SELECT pc.id, pc.numero, pc.status, pc.observacao, pc.valor_total, pc.enviado_email_em,
       pc.criado_em, pc.fornecedor_id, f.razao_social AS fornecedor_nome, f.email AS fornecedor_email
     FROM TAB_PEDIDO_COMPRA pc
     JOIN TAB_FORNECEDOR f ON f.id = pc.fornecedor_id
     ORDER BY pc.criado_em DESC`
  )
  return NextResponse.json(pedidos)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const {
    fornecedorId,
    observacao,
    itens,
  }: {
    fornecedorId?: string
    observacao?: string | null
    itens: ItemPedidoCompra[]
  } = await request.json()

  if (!fornecedorId) {
    return NextResponse.json({ erro: "Fornecedor e obrigatorio" }, { status: 400 })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Adicione pelo menos um item" }, { status: 400 })
  }

  const valorTotal = itens.reduce((soma, item) => soma + item.quantidade * item.custoUnitario, 0)

  const pedido = await transacao(async (executar) => {
    const [criado] = await executar(
      `INSERT INTO TAB_PEDIDO_COMPRA (fornecedor_id, observacao, valor_total)
       VALUES ($1, $2, $3)
       RETURNING id, numero, status, observacao, valor_total, criado_em`,
      [fornecedorId, observacao || null, valorTotal]
    )

    for (const item of itens) {
      await executar(
        `INSERT INTO TAB_PEDIDO_COMPRA_ITEM
           (pedido_compra_id, produto_id, descricao, quantidade, custo_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          criado.id,
          item.produtoId || null,
          item.descricao,
          item.quantidade,
          item.custoUnitario,
          item.quantidade * item.custoUnitario,
        ]
      )
    }

    return criado
  })

  return NextResponse.json(pedido, { status: 201 })
}
