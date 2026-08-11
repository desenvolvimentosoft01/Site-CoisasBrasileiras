import { transacao, query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { calcularOpcoesFrete, getConfiguracoes } from "@/lib/configuracoes"
import { enviarEmail, templatePedidoCriado } from "@/lib/email"
import { resolverMarca } from "@/lib/marca"
import { NextResponse } from "next/server"

type ItemRequisicao = { produtoId: string; quantidade: number }
type OpcaoFreteEscolhida = { transportadora: string; servico: string }

export async function POST(request: Request) {
  const marca = resolverMarca(request.headers.get("host"))
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

  type EnderecoRequisicao = {
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
  }

  const { endereco, itens, cupomCodigo, freteEscolhido, cpfCnpj } = await request.json() as {
    endereco: EnderecoRequisicao
    itens: ItemRequisicao[]
    cupomCodigo?: string
    freteEscolhido?: OpcaoFreteEscolhida
    cpfCnpj?: string
  }

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
    return NextResponse.json({ erro: "Endereço incompleto" }, { status: 400 })
  }

  // Regra configuravel em Configuracoes > Regras - quando ligada, o
  // checkout so segue com CPF/CNPJ preenchido (no pedido ou ja salvo no
  // cadastro do cliente), pra nao travar a emissao da nota fiscal depois.
  const regras = await getConfiguracoes(["cpf_obrigatorio_checkout"])
  if (regras.cpf_obrigatorio_checkout === "true") {
    const [clienteCpf] = await query("SELECT cpf_cnpj FROM TAB_CLIENTE WHERE id = $1", [cliente.id])
    if (!cpfCnpj && !clienteCpf?.cpf_cnpj) {
      return NextResponse.json({ erro: "CPF ou CNPJ é obrigatório para finalizar a compra" }, { status: 400 })
    }
  }

  if (cpfCnpj) {
    try {
      await query("UPDATE TAB_CLIENTE SET cpf_cnpj = $1 WHERE id = $2", [cpfCnpj, cliente.id])
    } catch (erro) {
      // CPF/CNPJ ja cadastrado em outra conta (coluna UNIQUE) - nao trava o
      // checkout por causa disso, so ignora a atualizacao e segue com o
      // pedido (a nota fiscal usa o que ja estava salvo, se houver).
      if (!(erro instanceof Error && "code" in erro && erro.code === "23505")) throw erro
    }
  }

  try {
    const pedido = await transacao(async (q) => {
      // Reaproveita um endereco ja salvo se for identico (mesmo CEP, numero e
      // complemento) - evita duplicar a cada checkout com o mesmo endereco,
      // que so poluia "Enderecos salvos" em Minha Conta sem nenhum ganho.
      const [enderecoExistente] = await q(
        `SELECT id FROM TAB_ENDERECO
         WHERE cliente_id = $1 AND cep = $2 AND numero = $3
           AND COALESCE(complemento, '') = COALESCE($4, '')
         LIMIT 1`,
        [cliente.id, endereco.cep, endereco.numero, endereco.complemento || null]
      )

      // ON CONFLICT DO NOTHING cobre o caso de duas requisicoes de checkout
      // concorrentes (duplo clique, aba duplicada) passarem pelo SELECT
      // acima ao mesmo tempo sem ver o endereco uma da outra - o indice
      // unico idx_endereco_dedup garante que so uma insercao vinga; se a
      // insercao nao retornar nada, o endereco ja existe e e buscado de novo.
      const enderecoSalvo =
        enderecoExistente ??
        (
          await q(
            `INSERT INTO TAB_ENDERECO (cliente_id, cep, logradouro, numero, complemento, bairro, cidade, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (cliente_id, cep, numero, COALESCE(complemento, ''))
             DO NOTHING
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
        )[0] ??
        (
          await q(
            `SELECT id FROM TAB_ENDERECO
             WHERE cliente_id = $1 AND cep = $2 AND numero = $3
               AND COALESCE(complemento, '') = COALESCE($4, '')
             LIMIT 1`,
            [cliente.id, endereco.cep, endereco.numero, endereco.complemento || null]
          )
        )[0]

      let subtotal = 0
      let pesoKg = 0
      const itensParaInserir: {
        produtoId: string
        nome: string
        quantidade: number
        precoUnitario: number
      }[] = []
      const itensDetalhados: Parameters<typeof calcularOpcoesFrete>[0]["itensDetalhados"] = []

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

      // Opcoes de frete recalculadas no servidor a partir do peso real dos
      // itens e do estado/CEP de entrega - nunca confia num valor de frete
      // vindo do client. O client so manda QUAL opcao o cliente escolheu
      // (transportadora + servico); o preco usado e sempre o que o servidor
      // acabou de calcular pra essa opcao, nunca o que veio no corpo da
      // requisicao.
      const opcoesFrete = await calcularOpcoesFrete({
        subtotal,
        pesoKg,
        estado: endereco.estado,
        cepDestino: endereco.cep,
        itensDetalhados,
      })

      const opcaoEscolhida =
        (freteEscolhido &&
          opcoesFrete.find(
            (o) => o.transportadora === freteEscolhido.transportadora && o.servico === freteEscolhido.servico
          )) ||
        opcoesFrete[0] // se nao veio escolha valida (ou a lista mudou entre a cotacao e o envio), usa a mais barata

      const valorFrete = opcaoEscolhida.valor

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
          throw new Error("Cupom não encontrado")
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

      // Se o cliente reenviar o mesmo checkout (duplo clique, reload apos
      // falha no gateway, aba duplicada) enquanto o pedido anterior ainda
      // esta aguardando pagamento com o mesmo endereco/total, reaproveita
      // esse pedido em vez de criar outro identico - so gera um link novo
      // de pagamento pra ele la embaixo.
      const [pedidoPendenteExistente] = await q(
        `SELECT id FROM TAB_PEDIDO
         WHERE cliente_id = $1 AND endereco_id = $2 AND status = 'aguardando_pagamento'
           AND total = $3 AND criado_em > NOW() - INTERVAL '30 minutes'
         ORDER BY criado_em DESC
         LIMIT 1`,
        [cliente.id, enderecoSalvo.id, total]
      )

      let pedidoCriado = pedidoPendenteExistente

      if (!pedidoCriado) {
        ;[pedidoCriado] = await q(
          `INSERT INTO TAB_PEDIDO (cliente_id, endereco_id, subtotal, valor_frete, valor_desconto, cupom_id, total, status, gateway_pagamento, canal, marca)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'aguardando_pagamento', $8, 'site', $9)
           RETURNING id`,
          [cliente.id, enderecoSalvo.id, subtotal, valorFrete, valorDesconto, cupomId, total, "mercadopago", marca]
        )

        for (const item of itensParaInserir) {
          await q(
            "INSERT INTO TAB_PEDIDO_ITEM (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
            [pedidoCriado.id, item.produtoId, item.quantidade, item.precoUnitario]
          )
        }
      }

      return { ...pedidoCriado, itensParaInserir, subtotal, valorFrete, valorDesconto }
    })

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

    // O pagamento em si (cartao/Pix) acontece na propria tela do checkout via
    // Payment Brick, num segundo passo que chama /api/checkout/pagamento -
    // aqui so devolvemos o pedido criado e o total pra inicializar o Brick.
    const total = pedido.subtotal + pedido.valorFrete - pedido.valorDesconto
    return NextResponse.json({ pedidoId: pedido.id, total })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao processar pedido" },
      { status: 400 }
    )
  }
}
