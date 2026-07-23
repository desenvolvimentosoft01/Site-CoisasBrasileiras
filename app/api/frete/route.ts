import { getConfiguracoes, calcularFrete } from "@/lib/configuracoes"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"

type ItemRequisicao = { produtoId: string; quantidade: number }

// POST porque precisa mandar a lista de itens (pra calcular peso e subtotal
// no servidor - nunca confia em preco/peso vindo do client) e o estado de
// entrega escolhido no checkout.
export async function POST(request: Request) {
  const { itens, estado }: { itens: ItemRequisicao[]; estado: string } = await request.json()

  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Carrinho vazio" }, { status: 400 })
  }

  let subtotal = 0
  let pesoKg = 0

  for (const item of itens) {
    const [produto] = await query(
      "SELECT preco, preco_promocional, peso_kg FROM TAB_PRODUTO WHERE id = $1 AND ativo = true",
      [item.produtoId]
    )
    if (!produto) continue

    const precoUnitario = Number(produto.preco_promocional ?? produto.preco)
    subtotal += precoUnitario * item.quantidade
    pesoKg += Number(produto.peso_kg || 0) * item.quantidade
  }

  const { valor: valorFrete, prazoDias } = await calcularFrete({ subtotal, pesoKg, estado: estado || "" })
  const config = await getConfiguracoes(["frete_gratis_acima_de"])

  return NextResponse.json({
    valorFrete,
    prazoDias,
    freteGratisAcimaDe: Number(config.frete_gratis_acima_de) || 0,
  })
}
