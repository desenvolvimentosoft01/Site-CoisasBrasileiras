import { transacao, query } from "@/lib/db"
import { registrarMovimentoEstoque } from "@/lib/estoque-movimento"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Converte um orcamento aprovado numa venda de verdade (TAB_PEDIDO, origem
// 'balcao'). Mesma logica de baixa de estoque da venda balcao: FOR UPDATE +
// checagem de estoque disponivel, tudo numa unica transacao.
//
// Itens sem produto vinculado (servico/descricao livre, ex: "instalacao")
// entram no valor total da venda mas nao geram linha em TAB_PEDIDO_ITEM (essa
// tabela exige produto_id) nem baixam estoque - so os itens de produto fazem isso.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { formaPagamento }: { formaPagamento: string } = await request.json()

  if (!formaPagamento) {
    return NextResponse.json({ erro: "Forma de pagamento é obrigatória" }, { status: 400 })
  }

  const [orcamento] = await query(
    `SELECT id, status, total, cliente_id, cliente_nome, cliente_telefone, marca
     FROM TAB_ORCAMENTO WHERE id = $1`,
    [id]
  )
  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 })
  }
  if (orcamento.status !== "aprovado") {
    return NextResponse.json(
      { erro: "Só é possível converter um orçamento aprovado" },
      { status: 400 }
    )
  }

  const itens = await query(
    `SELECT produto_id, descricao, quantidade, valor_unitario
     FROM TAB_ORCAMENTO_ITEM WHERE orcamento_id = $1`,
    [id]
  )

  try {
    const pedido = await transacao(async (executar) => {
      const itensProduto = itens.filter((item) => item.produto_id)

      for (const item of itensProduto) {
        const [produto] = await executar(
          "SELECT id, nome, estoque FROM TAB_PRODUTO WHERE id = $1 FOR UPDATE",
          [item.produto_id]
        )
        if (!produto) {
          throw new Error(`Produto do orcamento nao encontrado (${item.descricao})`)
        }
        if (produto.estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para "${produto.nome}" (disponivel: ${produto.estoque})`)
        }
      }

      const [pedidoCriado] = await executar(
        `INSERT INTO TAB_PEDIDO
           (cliente_id, endereco_id, status, total, forma_pagamento, origem, cliente_nome_avulso, cliente_telefone_avulso, marca)
         VALUES ($1, NULL, 'pago', $2, $3, 'balcao', $4, $5, $6)
         RETURNING id, total, criado_em`,
        [
          orcamento.cliente_id || null,
          orcamento.total,
          formaPagamento,
          orcamento.cliente_id ? null : orcamento.cliente_nome,
          orcamento.cliente_id ? null : orcamento.cliente_telefone,
          orcamento.marca,
        ]
      )

      for (const item of itensProduto) {
        await executar(
          "INSERT INTO TAB_PEDIDO_ITEM (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
          [pedidoCriado.id, item.produto_id, item.quantidade, item.valor_unitario]
        )
        const [produtoAtualizado] = await executar(
          "UPDATE TAB_PRODUTO SET estoque = estoque - $1 WHERE id = $2 RETURNING estoque",
          [item.quantidade, item.produto_id]
        )
        await registrarMovimentoEstoque(executar, {
          produtoId: item.produto_id,
          quantidade: Number(item.quantidade),
          tipo: "saida",
          motivo: "venda",
          saldoApos: Number(produtoAtualizado?.estoque ?? 0),
          origemTipo: "pedido",
          origemId: pedidoCriado.id,
          observacao: "Orçamento convertido em pedido",
        })
      }

      await executar(
        "UPDATE TAB_ORCAMENTO SET status = 'convertido', pedido_id = $1, atualizado_em = NOW() WHERE id = $2",
        [pedidoCriado.id, id]
      )

      await executar(
        `INSERT INTO TAB_AUDITORIA (usuario_id, usuario_nome, tela, acao, tabela, registro_id, dados_depois)
         VALUES ($1, $2, 'Orcamentos', 'edicao', 'TAB_ORCAMENTO', $3, $4)`,
        [sessaoOuErro.id, sessaoOuErro.nome, id, { status: "convertido", pedido_id: pedidoCriado.id }]
      )

      return pedidoCriado
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao converter o orcamento em venda"
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }
}
