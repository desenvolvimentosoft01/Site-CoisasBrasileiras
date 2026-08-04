import { transacao } from "@/lib/db"
import { listarCompras } from "@/lib/compras"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const compras = await listarCompras()
  return NextResponse.json(compras)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const dados = await request.json()
  const {
    fornecedorId,
    numeroNota,
    chaveAcesso,
    valorFrete,
    dataCompra,
    dataVencimento,
    observacao,
    itens,
    blingNotaId,
    pedidoCompraId,
  } = dados

  if (!fornecedorId) {
    return NextResponse.json({ erro: "Fornecedor é obrigatório" }, { status: 400 })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Adicione pelo menos um item" }, { status: 400 })
  }
  for (const item of itens) {
    if (!item.produtoId || !(Number(item.quantidade) > 0) || Number(item.custoUnitario) < 0) {
      return NextResponse.json({ erro: "Item inválido: confira produto, quantidade e custo" }, { status: 400 })
    }
  }

  // Compra + itens numa unica transacao - sem isso, uma falha no meio do
  // loop de itens deixava uma compra "orfa" com itens incompletos no banco.
  const compra = await transacao(async (q) => {
    const [novaCompra] = await q(
      `INSERT INTO TAB_COMPRA (fornecedor_id, numero_nota, chave_acesso, valor_frete, data_compra, data_vencimento, observacao, bling_nota_id, pedido_compra_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, fornecedor_id, numero_nota, chave_acesso, status, valor_frete, data_compra, data_vencimento, observacao, criado_em`,
      [
        fornecedorId,
        numeroNota || null,
        chaveAcesso ? String(chaveAcesso).replace(/\D/g, "") : null,
        Number(valorFrete) || 0,
        dataCompra || new Date(),
        dataVencimento || null,
        observacao || null,
        blingNotaId || null,
        pedidoCompraId || null,
      ]
    )

    for (const item of itens) {
      await q(
        "INSERT INTO TAB_COMPRA_ITEM (compra_id, produto_id, quantidade, custo_unitario) VALUES ($1, $2, $3, $4)",
        [novaCompra.id, item.produtoId, Number(item.quantidade), Number(item.custoUnitario)]
      )
    }

    if (pedidoCompraId) {
      await q(
        "UPDATE TAB_PEDIDO_COMPRA SET status = 'atendido', atualizado_em = NOW() WHERE id = $1",
        [pedidoCompraId]
      )
    }

    return novaCompra
  })

  return NextResponse.json(compra, { status: 201 })
}
