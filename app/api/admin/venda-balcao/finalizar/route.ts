import { transacao } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

type ItemVenda = {
  produtoId: string
  quantidade: number
  precoUnitario: number
}

// Transacao atomica: valida estoque com FOR UPDATE (trava a linha contra
// concorrencia), baixa o estoque, grava o pedido + itens e a auditoria - tudo
// ou nada. Equivalente a RPC "finalizar_venda_balcao" do InMenteGestao,
// porem como uma unica transacao via pg em vez de uma function no banco.
export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const {
    itens,
    formaPagamento,
    clienteId,
    clienteNomeAvulso,
    clienteTelefoneAvulso,
    tipoEntregaId,
    canal,
  }: {
    itens: ItemVenda[]
    formaPagamento: string
    clienteId?: string | null
    clienteNomeAvulso?: string | null
    clienteTelefoneAvulso?: string | null
    tipoEntregaId?: string | null
    canal?: string
  } = await request.json()

  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "A venda precisa ter pelo menos um item" }, { status: 400 })
  }
  if (!formaPagamento) {
    return NextResponse.json({ erro: "Forma de pagamento é obrigatória" }, { status: 400 })
  }

  try {
    const pedido = await transacao(async (executar) => {
      let total = 0
      let marcaPedido: string | null = null

      for (const item of itens) {
        const [produto] = await executar(
          "SELECT id, nome, estoque, marca FROM TAB_PRODUTO WHERE id = $1 FOR UPDATE",
          [item.produtoId]
        )
        if (!produto) {
          throw new Error(`Produto nao encontrado: ${item.produtoId}`)
        }
        if (produto.estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para "${produto.nome}" (disponivel: ${produto.estoque})`)
        }
        total += item.quantidade * item.precoUnitario
        // Venda com itens de marcas diferentes (raro) fica com a marca do
        // primeiro item - so pra filtro/relatorio, nao afeta a venda em si.
        if (!marcaPedido) marcaPedido = produto.marca
      }

      const [pedidoCriado] = await executar(
        `INSERT INTO TAB_PEDIDO
           (cliente_id, endereco_id, status, total, forma_pagamento, origem, cliente_nome_avulso, cliente_telefone_avulso, tipo_entrega_id, canal, marca)
         VALUES ($1, NULL, 'pago', $2, $3, 'balcao', $4, $5, $6, $7, $8)
         RETURNING id, total, criado_em`,
        [
          clienteId || null,
          total,
          formaPagamento,
          clienteNomeAvulso || null,
          clienteTelefoneAvulso || null,
          tipoEntregaId || null,
          canal || "balcao",
          marcaPedido || "colorido",
        ]
      )

      for (const item of itens) {
        await executar(
          "INSERT INTO TAB_PEDIDO_ITEM (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
          [pedidoCriado.id, item.produtoId, item.quantidade, item.precoUnitario]
        )
        await executar("UPDATE TAB_PRODUTO SET estoque = estoque - $1 WHERE id = $2", [
          item.quantidade,
          item.produtoId,
        ])
      }

      await executar(
        `INSERT INTO TAB_AUDITORIA (usuario_id, usuario_nome, tela, acao, tabela, registro_id, dados_depois)
         VALUES ($1, $2, 'Venda Balcao', 'cadastro', 'TAB_PEDIDO', $3, $4)`,
        [
          sessaoOuErro.id,
          sessaoOuErro.nome,
          pedidoCriado.id,
          { total, forma_pagamento: formaPagamento, itens: itens.length },
        ]
      )

      return pedidoCriado
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao finalizar a venda"
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }
}
