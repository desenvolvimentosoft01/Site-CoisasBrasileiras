import { transacao, query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
import { NextResponse } from "next/server"

type ItemPedidoCompra = {
  produtoId?: string | null
  descricao: string
  quantidade: number
  custoUnitario: number
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [pedido] = await query(
    `SELECT pc.id, pc.numero, pc.status, pc.observacao, pc.valor_total, pc.desconto, pc.enviado_email_em,
       pc.criado_em, pc.fornecedor_id, f.razao_social AS fornecedor_nome, f.email AS fornecedor_email,
       f.telefone AS fornecedor_telefone
     FROM TAB_PEDIDO_COMPRA pc
     JOIN TAB_FORNECEDOR f ON f.id = pc.fornecedor_id
     WHERE pc.id = $1`,
    [id]
  )
  if (!pedido) {
    return NextResponse.json({ erro: "Pedido de compra não encontrado" }, { status: 404 })
  }

  const itens = await query(
    `SELECT id, produto_id, descricao, quantidade, custo_unitario, subtotal
     FROM TAB_PEDIDO_COMPRA_ITEM WHERE pedido_compra_id = $1 ORDER BY id`,
    [id]
  )

  return NextResponse.json({ ...pedido, itens })
}

// So permite editar enquanto "aberto" - depois de enviado/atendido/cancelado
// o historico fica congelado (mesma regra do orcamento).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
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
    return NextResponse.json({ erro: "Fornecedor é obrigatório" }, { status: 400 })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Adicione pelo menos um item" }, { status: 400 })
  }

  const [atual] = await query("SELECT status FROM TAB_PEDIDO_COMPRA WHERE id = $1", [id])
  if (!atual) {
    return NextResponse.json({ erro: "Pedido de compra não encontrado" }, { status: 404 })
  }
  if (atual.status !== "aberto") {
    return NextResponse.json({ erro: "Só é possível editar pedidos de compra em aberto" }, { status: 400 })
  }

  const valorTotal = itens.reduce((soma, item) => soma + item.quantidade * item.custoUnitario, 0)

  const pedido = await transacao(async (executar) => {
    const [atualizado] = await executar(
      `UPDATE TAB_PEDIDO_COMPRA
       SET fornecedor_id = $1, observacao = $2, valor_total = $3, atualizado_em = NOW()
       WHERE id = $4
       RETURNING id, numero, status, observacao, valor_total, criado_em`,
      [fornecedorId, observacao || null, valorTotal, id]
    )

    await executar("DELETE FROM TAB_PEDIDO_COMPRA_ITEM WHERE pedido_compra_id = $1", [id])
    for (const item of itens) {
      await executar(
        `INSERT INTO TAB_PEDIDO_COMPRA_ITEM
           (pedido_compra_id, produto_id, descricao, quantidade, custo_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, item.produtoId || null, item.descricao, item.quantidade, item.custoUnitario, item.quantidade * item.custoUnitario]
      )
    }

    return atualizado
  })

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Pedidos de compra",
    acao: "edicao",
    tabela: "TAB_PEDIDO_COMPRA",
    registroId: id,
    depois: { numero: pedido.numero, valor_total: valorTotal, itens: itens.length },
  })

  return NextResponse.json(pedido)
}

const STATUS_VALIDOS = ["aberto", "enviado", "atendido", "cancelado"]

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { status } = await request.json()

  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ erro: "Status inválido" }, { status: 400 })
  }

  const [atual] = await query("SELECT status FROM TAB_PEDIDO_COMPRA WHERE id = $1", [id])
  if (!atual) {
    return NextResponse.json({ erro: "Pedido de compra não encontrado" }, { status: 404 })
  }
  if (atual.status === "atendido") {
    return NextResponse.json({ erro: "Pedido de compra já atendido (entrada lançada)" }, { status: 400 })
  }

  const [pedido] = await query(
    "UPDATE TAB_PEDIDO_COMPRA SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING id, status",
    [status, id]
  )

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Pedidos de compra",
    acao: "edicao",
    tabela: "TAB_PEDIDO_COMPRA",
    registroId: id,
    antes: { status: atual.status },
    depois: { status: pedido.status },
  })

  return NextResponse.json(pedido)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [atual] = await query("SELECT status FROM TAB_PEDIDO_COMPRA WHERE id = $1", [id])
  if (atual?.status === "atendido") {
    return NextResponse.json(
      { erro: "Não é possível excluir um pedido de compra já atendido" },
      { status: 409 }
    )
  }

  // RETURNING guarda o que sumiu: depois do DELETE nao existe mais lugar
  // nenhum pra consultar o que esse pedido tinha.
  const [excluido] = await query(
    "DELETE FROM TAB_PEDIDO_COMPRA WHERE id = $1 RETURNING numero, status, fornecedor_id, valor_total",
    [id]
  )

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Pedidos de compra",
    acao: "exclusao",
    tabela: "TAB_PEDIDO_COMPRA",
    registroId: id,
    antes: excluido ?? null,
  })

  return NextResponse.json({ sucesso: true })
}
