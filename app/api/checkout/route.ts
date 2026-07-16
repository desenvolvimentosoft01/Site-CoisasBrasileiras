import { transacao, query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

type ItemRequisicao = { produtoId: string; quantidade: number }

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro
  const cliente = sessaoOuErro

  const { endereco, itens } = await request.json()

  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Carrinho vazio" }, { status: 400 })
  }

  if (
    !endereco?.cep ||
    !endereco?.logradouro ||
    !endereco?.numero ||
    !endereco?.bairro ||
    !endereco?.cidade ||
    !endereco?.estado
  ) {
    return NextResponse.json({ erro: "Endereco incompleto" }, { status: 400 })
  }

  try {
    const pedido = await transacao(async (q) => {
      const [enderecoSalvo] = await q(
        `INSERT INTO TAB_ENDERECO (cliente_id, cep, logradouro, numero, complemento, bairro, cidade, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          cliente.id,
          endereco.cep,
          endereco.logradouro,
          endereco.numero,
          endereco.complemento || null,
          endereco.bairro,
          endereco.cidade,
          endereco.estado,
        ]
      )

      let total = 0
      const itensParaInserir: { produtoId: string; quantidade: number; precoUnitario: number }[] = []

      // Recalcula o preco e valida estoque a partir do banco - nunca confia
      // no preco/quantidade que vem do client.
      for (const item of itens as ItemRequisicao[]) {
        const [produto] = await q(
          "SELECT id, preco, preco_promocional, estoque FROM TAB_PRODUTO WHERE id = $1 AND ativo = true FOR UPDATE",
          [item.produtoId]
        )

        if (!produto) {
          throw new Error(`Produto nao encontrado: ${item.produtoId}`)
        }
        if (produto.estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para o produto ${item.produtoId}`)
        }

        const precoUnitario = Number(produto.preco_promocional ?? produto.preco)
        total += precoUnitario * item.quantidade

        itensParaInserir.push({
          produtoId: produto.id,
          quantidade: item.quantidade,
          precoUnitario,
        })

        await q("UPDATE TAB_PRODUTO SET estoque = estoque - $1 WHERE id = $2", [
          item.quantidade,
          produto.id,
        ])
      }

      const [pedidoCriado] = await q(
        `INSERT INTO TAB_PEDIDO (cliente_id, endereco_id, total, status)
         VALUES ($1, $2, $3, 'aguardando_pagamento')
         RETURNING id`,
        [cliente.id, enderecoSalvo.id, total]
      )

      for (const item of itensParaInserir) {
        await q(
          "INSERT INTO TAB_PEDIDO_ITEM (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
          [pedidoCriado.id, item.produtoId, item.quantidade, item.precoUnitario]
        )
      }

      return pedidoCriado
    })

    return NextResponse.json({ pedidoId: pedido.id })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao processar pedido" },
      { status: 400 }
    )
  }
}
