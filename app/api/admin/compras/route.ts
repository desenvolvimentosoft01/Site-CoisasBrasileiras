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
  const { fornecedorId, numeroNota, valorFrete, dataCompra, observacao, itens } = dados

  if (!fornecedorId) {
    return NextResponse.json({ erro: "Fornecedor e obrigatorio" }, { status: 400 })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Adicione pelo menos um item" }, { status: 400 })
  }
  for (const item of itens) {
    if (!item.produtoId || !(Number(item.quantidade) > 0) || Number(item.custoUnitario) < 0) {
      return NextResponse.json({ erro: "Item invalido: confira produto, quantidade e custo" }, { status: 400 })
    }
  }

  // Compra + itens numa unica transacao - sem isso, uma falha no meio do
  // loop de itens deixava uma compra "orfa" com itens incompletos no banco.
  const compra = await transacao(async (q) => {
    const [novaCompra] = await q(
      `INSERT INTO TAB_COMPRA (fornecedor_id, numero_nota, valor_frete, data_compra, observacao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, fornecedor_id, numero_nota, status, valor_frete, data_compra, observacao, criado_em`,
      [fornecedorId, numeroNota || null, Number(valorFrete) || 0, dataCompra || new Date(), observacao || null]
    )

    for (const item of itens) {
      await q(
        "INSERT INTO TAB_COMPRA_ITEM (compra_id, produto_id, quantidade, custo_unitario) VALUES ($1, $2, $3, $4)",
        [novaCompra.id, item.produtoId, Number(item.quantidade), Number(item.custoUnitario)]
      )
    }

    return novaCompra
  })

  return NextResponse.json(compra, { status: 201 })
}
