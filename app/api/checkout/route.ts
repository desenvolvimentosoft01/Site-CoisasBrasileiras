import { transacao, query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { preferenceMP } from "@/lib/mercadopago"
import { criarCheckoutPagBank } from "@/lib/pagbank"
import { calcularFrete } from "@/lib/configuracoes"
import { enviarEmail, templatePedidoCriado } from "@/lib/email"
import { NextResponse } from "next/server"

type ItemRequisicao = { produtoId: string; quantidade: number }

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro
  const cliente = sessaoOuErro

  // O cookie de sessao pode ter sido emitido antes do admin inativar o
  // cliente (sessao dura 30 dias) - reconfere no banco pra nao deixar um
  // cliente inativado finalizar compra so porque ainda esta logado.
  const [clienteAtual] = await query("SELECT ativo FROM TAB_CLIENTE WHERE id = $1", [cliente.id])
  if (!clienteAtual || !clienteAtual.ativo) {
    return NextResponse.json({ erro: "Conta desativada. Entre em contato com a loja." }, { status: 403 })
  }

  const { endereco, itens, cupomCodigo, gateway } = await request.json()
  const gatewayEscolhido: "mercadopago" | "pagbank" = gateway === "pagbank" ? "pagbank" : "mercadopago"

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
      let pesoKg = 0
      const itensParaInserir: {
        produtoId: string
        nome: string
        quantidade: number
        precoUnitario: number
      }[] = []
      const itensDetalhados: Parameters<typeof calcularFrete>[0]["itensDetalhados"] = []

      // Recalcula o preco e valida estoque a partir do banco - nunca confia
      // no preco/quantidade que vem do client.
      for (const item of itens as ItemRequisicao[]) {
        const [produto] = await q(
          "SELECT id, nome, preco, preco_promocional, estoque, peso_kg, altura_cm, largura_cm, comprimento_cm FROM TAB_PRODUTO WHERE id = $1 AND ativo = true FOR UPDATE",
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
        pesoKg += Number(produto.peso_kg || 0) * item.quantidade

        itensParaInserir.push({
          produtoId: produto.id,
          nome: produto.nome,
          quantidade: item.quantidade,
          precoUnitario,
        })
        itensDetalhados!.push({
          quantidade: item.quantidade,
          pesoKg: Number(produto.peso_kg || 0),
          alturaCm: Number(produto.altura_cm || 0),
          larguraCm: Number(produto.largura_cm || 0),
          comprimentoCm: Number(produto.comprimento_cm || 0),
          valorUnitario: precoUnitario,
        })

        // O estoque so e baixado quando o pagamento e confirmado (webhook do
        // Mercado Pago) - se o cliente abandonar o checkout sem pagar, o
        // produto continua disponivel normalmente.
      }

      // Frete calculado no servidor a partir do peso real dos itens e do
      // estado/CEP de entrega - nunca confia num valor de frete vindo do client.
      const { valor: valorFrete } = await calcularFrete({
        subtotal,
        pesoKg,
        estado: endereco.estado,
        cepDestino: endereco.cep,
        itensDetalhados,
      })

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
        `INSERT INTO TAB_PEDIDO (cliente_id, endereco_id, subtotal, valor_frete, valor_desconto, cupom_id, total, status, gateway_pagamento, canal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'aguardando_pagamento', $8, 'site')
         RETURNING id`,
        [cliente.id, enderecoSalvo.id, subtotal, valorFrete, valorDesconto, cupomId, total, gatewayEscolhido]
      )

      for (const item of itensParaInserir) {
        await q(
          "INSERT INTO TAB_PEDIDO_ITEM (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
          [pedidoCriado.id, item.produtoId, item.quantidade, item.precoUnitario]
        )
      }

      return { ...pedidoCriado, itensParaInserir, subtotal, valorFrete, valorDesconto }
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const ehHttps = siteUrl.startsWith("https://")

    let checkoutUrl: string | null | undefined

    // A criacao do link de pagamento fica isolada num try/catch proprio: um
    // erro aqui e sempre de infraestrutura (token nao configurado, gateway
    // fora do ar) e nunca deve vazar detalhe interno (nome de variavel de
    // ambiente, corpo de erro da API externa) pro cliente no checkout - so
    // uma mensagem generica. O detalhe real vai pro log do servidor.
    try {
      if (gatewayEscolhido === "pagbank") {
        // Consolida tudo (itens + frete - desconto) num unico item: a API do
        // PagBank nao documenta suporte a item com preco negativo pra desconto
        // como o Mercado Pago aceita, entao evitamos o risco de a soma dos itens
        // nao bater com o total cobrado.
        const totalPedido = pedido.subtotal + pedido.valorFrete - pedido.valorDesconto
        const checkoutPagBank = await criarCheckoutPagBank({
          referenceId: pedido.id,
          itens: [
            {
              referenceId: pedido.id,
              nome: `Pedido Coisas Brasileiras #${String(pedido.id).slice(0, 8).toUpperCase()}`,
              quantidade: 1,
              valorUnitario: totalPedido,
            },
          ],
          valorFrete: 0, // ja incluso no item consolidado acima
          returnUrl: `${siteUrl}/pedido/${pedido.id}`,
          notificationUrl: `${siteUrl}/api/webhooks/pagbank`,
        })
        checkoutUrl = checkoutPagBank.redirect_url
      } else {
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
        checkoutUrl = preferencia.init_point
      }
    } catch (erroGateway) {
      console.error("[checkout] Falha ao criar link de pagamento:", erroGateway)
      return NextResponse.json(
        { erro: "Nao foi possivel iniciar o pagamento agora. Tente novamente em instantes." },
        { status: 502 }
      )
    }

    // Nao usa await de proposito - o email nao deve atrasar a resposta do
    // checkout, e uma falha de envio ja e tratada (logada) dentro de enviarEmail.
    enviarEmail({
      to: cliente.email,
      subject: "Recebemos seu pedido - Coisas Brasileiras",
      html: templatePedidoCriado({
        nomeCliente: cliente.nome,
        pedidoId: pedido.id,
        itens: pedido.itensParaInserir,
        total: pedido.subtotal + pedido.valorFrete - pedido.valorDesconto,
      }),
    })

    return NextResponse.json({ pedidoId: pedido.id, checkoutUrl })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao processar pedido" },
      { status: 400 }
    )
  }
}
