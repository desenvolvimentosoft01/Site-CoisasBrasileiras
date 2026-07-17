import { transacao, query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { preferenceMP } from "@/lib/mercadopago"
import { calcularFrete } from "@/lib/configuracoes"
import { NextResponse } from "next/server"

type ItemRequisicao = { produtoId: string; quantidade: number }

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro
  const cliente = sessaoOuErro

  const { endereco, itens, cupomCodigo } = await request.json()

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

      let subtotal = 0
      const itensParaInserir: {
        produtoId: string
        nome: string
        quantidade: number
        precoUnitario: number
      }[] = []

      // Recalcula o preco e valida estoque a partir do banco - nunca confia
      // no preco/quantidade que vem do client.
      for (const item of itens as ItemRequisicao[]) {
        const [produto] = await q(
          "SELECT id, nome, preco, preco_promocional, estoque FROM TAB_PRODUTO WHERE id = $1 AND ativo = true FOR UPDATE",
          [item.produtoId]
        )

        if (!produto) {
          throw new Error(`Produto nao encontrado: ${item.produtoId}`)
        }
        if (produto.estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para o produto ${item.produtoId}`)
        }

        const precoUnitario = Number(produto.preco_promocional ?? produto.preco)
        subtotal += precoUnitario * item.quantidade

        itensParaInserir.push({
          produtoId: produto.id,
          nome: produto.nome,
          quantidade: item.quantidade,
          precoUnitario,
        })

        // O estoque so e baixado quando o pagamento e confirmado (webhook do
        // Mercado Pago) - se o cliente abandonar o checkout sem pagar, o
        // produto continua disponivel normalmente.
      }

      // Frete calculado no servidor a partir das configuracoes da loja -
      // nunca confia num valor de frete vindo do client.
      const valorFrete = await calcularFrete(subtotal)

      // Cupom revalidado e aplicado dentro da propria transacao, com
      // FOR UPDATE na linha do cupom - evita que dois checkouts simultaneos
      // estourem o uso_maximo (condicao de corrida classica).
      let valorDesconto = 0
      let cupomId: string | null = null

      if (cupomCodigo) {
        const [cupom] = await q(
          "SELECT * FROM TAB_CUPOM WHERE codigo = $1 AND ativo = true FOR UPDATE",
          [String(cupomCodigo).trim().toUpperCase()]
        )

        if (!cupom) {
          throw new Error("Cupom nao encontrado")
        }
        if (cupom.validade && new Date(cupom.validade) < new Date()) {
          throw new Error("Cupom expirado")
        }
        if (cupom.uso_maximo !== null && cupom.usos_atuais >= cupom.uso_maximo) {
          throw new Error("Cupom esgotado")
        }
        if (subtotal < Number(cupom.valor_minimo)) {
          throw new Error(`Cupom valido para compras a partir de R$ ${Number(cupom.valor_minimo).toFixed(2)}`)
        }
        if (cupom.primeira_compra_apenas) {
          const [pedidoAnterior] = await q(
            "SELECT id FROM TAB_PEDIDO WHERE cliente_id = $1 AND status = 'pago' LIMIT 1",
            [cliente.id]
          )
          if (pedidoAnterior) {
            throw new Error("Cupom valido apenas na primeira compra")
          }
        }

        valorDesconto =
          cupom.tipo === "percentual"
            ? Math.round(((subtotal * Number(cupom.valor)) / 100) * 100) / 100
            : Math.min(Number(cupom.valor), subtotal)
        cupomId = cupom.id

        await q("UPDATE TAB_CUPOM SET usos_atuais = usos_atuais + 1 WHERE id = $1", [cupom.id])
      }

      const total = subtotal + valorFrete - valorDesconto

      const [pedidoCriado] = await q(
        `INSERT INTO TAB_PEDIDO (cliente_id, endereco_id, subtotal, valor_frete, valor_desconto, cupom_id, total, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'aguardando_pagamento')
         RETURNING id`,
        [cliente.id, enderecoSalvo.id, subtotal, valorFrete, valorDesconto, cupomId, total]
      )

      for (const item of itensParaInserir) {
        await q(
          "INSERT INTO TAB_PEDIDO_ITEM (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
          [pedidoCriado.id, item.produtoId, item.quantidade, item.precoUnitario]
        )
      }

      return { ...pedidoCriado, itensParaInserir, valorFrete, valorDesconto }
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const ehHttps = siteUrl.startsWith("https://")

    // auto_return exige back_urls publicas em https - em dev local (http) o
    // Mercado Pago rejeita, entao so habilitamos quando o site ja estiver publicado.
    const preferencia = await preferenceMP.create({
      body: {
        items: [
          ...pedido.itensParaInserir.map(
            (item: { produtoId: string; nome: string; quantidade: number; precoUnitario: number }) => ({
              id: item.produtoId,
              title: item.nome,
              quantity: item.quantidade,
              unit_price: item.precoUnitario,
              currency_id: "BRL",
            })
          ),
          ...(pedido.valorFrete > 0
            ? [
                {
                  id: "frete",
                  title: "Frete",
                  quantity: 1,
                  unit_price: pedido.valorFrete,
                  currency_id: "BRL" as const,
                },
              ]
            : []),
          // O Mercado Pago aceita item com preco negativo para representar
          // desconto, desde que a soma final feche com o total do pedido.
          ...(pedido.valorDesconto > 0
            ? [
                {
                  id: "desconto",
                  title: "Desconto (cupom)",
                  quantity: 1,
                  unit_price: -pedido.valorDesconto,
                  currency_id: "BRL" as const,
                },
              ]
            : []),
        ],
        external_reference: pedido.id,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${siteUrl}/pedido/${pedido.id}`,
          pending: `${siteUrl}/pedido/${pedido.id}`,
          failure: `${siteUrl}/pedido/${pedido.id}`,
        },
        ...(ehHttps ? { auto_return: "approved" as const } : {}),
      },
    })

    return NextResponse.json({ pedidoId: pedido.id, checkoutUrl: preferencia.init_point })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao processar pedido" },
      { status: 400 }
    )
  }
}
