import { transacao, query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

type ItemOrcamento = {
  produtoId?: string | null
  descricao: string
  quantidade: number
  valorUnitario: number
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [orcamento] = await query(
    `SELECT id, numero, titulo, cliente_id, cliente_nome, cliente_telefone, cliente_email, condicoes,
       status, subtotal, desconto, total, pedido_id, token_aprovacao, canal_resposta,
       observacao_cliente, enviado_email_em, respondido_em, criado_em
     FROM TAB_ORCAMENTO WHERE id = $1`,
    [id]
  )
  if (!orcamento) {
    return NextResponse.json({ erro: "Orcamento nao encontrado" }, { status: 404 })
  }

  const itens = await query(
    `SELECT id, produto_id, descricao, quantidade, valor_unitario, subtotal
     FROM TAB_ORCAMENTO_ITEM WHERE orcamento_id = $1 ORDER BY id`,
    [id]
  )

  return NextResponse.json({ ...orcamento, itens })
}

// So permite editar orcamentos ainda "aberto" - depois de aprovado/recusado/
// convertido, o historico fica congelado (evita reescrever um documento que
// o cliente ja viu/decidiu sobre).
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const {
    titulo,
    clienteId,
    clienteNome,
    clienteTelefone,
    clienteEmail,
    condicoes,
    desconto,
    itens,
  }: {
    titulo?: string | null
    clienteId?: string | null
    clienteNome: string
    clienteTelefone?: string | null
    clienteEmail?: string | null
    condicoes?: string | null
    desconto?: number
    itens: ItemOrcamento[]
  } = await request.json()

  if (!clienteNome?.trim()) {
    return NextResponse.json({ erro: "Nome do cliente e obrigatorio" }, { status: 400 })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "O orcamento precisa ter pelo menos um item" }, { status: 400 })
  }

  const [atual] = await query("SELECT status FROM TAB_ORCAMENTO WHERE id = $1", [id])
  if (!atual) {
    return NextResponse.json({ erro: "Orcamento nao encontrado" }, { status: 404 })
  }
  if (atual.status !== "aberto") {
    return NextResponse.json({ erro: "So e possivel editar orcamentos em aberto" }, { status: 400 })
  }

  const subtotal = itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0)
  const valorDesconto = Math.min(Number(desconto) || 0, subtotal)
  const total = subtotal - valorDesconto

  const orcamento = await transacao(async (executar) => {
    const [atualizado] = await executar(
      `UPDATE TAB_ORCAMENTO
       SET titulo = $1, cliente_id = $2, cliente_nome = $3, cliente_telefone = $4, cliente_email = $5,
           condicoes = $6, subtotal = $7, desconto = $8, total = $9, atualizado_em = NOW()
       WHERE id = $10
       RETURNING id, numero, titulo, status, subtotal, desconto, total, criado_em`,
      [
        titulo || null,
        clienteId || null,
        clienteNome.trim(),
        clienteTelefone || null,
        clienteEmail || null,
        condicoes || null,
        subtotal,
        valorDesconto,
        total,
        id,
      ]
    )

    // Substitui os itens inteiros - mais simples e seguro que tentar
    // diff/merge, e o orcamento so e editavel enquanto "aberto" mesmo.
    await executar("DELETE FROM TAB_ORCAMENTO_ITEM WHERE orcamento_id = $1", [id])
    for (const item of itens) {
      await executar(
        `INSERT INTO TAB_ORCAMENTO_ITEM
           (orcamento_id, produto_id, descricao, quantidade, valor_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, item.produtoId || null, item.descricao, item.quantidade, item.valorUnitario, item.quantidade * item.valorUnitario]
      )
    }

    return atualizado
  })

  return NextResponse.json(orcamento)
}

const STATUS_VALIDOS = ["aberto", "aprovado", "recusado"]

// So aceita transicoes manuais entre aberto/aprovado/recusado - "convertido"
// so acontece via /converter (rota separada, que de fato gera a venda).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { status } = await request.json()

  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ erro: "Status invalido" }, { status: 400 })
  }

  const [atual] = await query("SELECT status FROM TAB_ORCAMENTO WHERE id = $1", [id])
  if (!atual) {
    return NextResponse.json({ erro: "Orcamento nao encontrado" }, { status: 404 })
  }
  if (atual.status === "convertido") {
    return NextResponse.json({ erro: "Orcamento ja convertido em venda" }, { status: 400 })
  }

  const [orcamento] = await query(
    "UPDATE TAB_ORCAMENTO SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING id, status",
    [status, id]
  )
  return NextResponse.json(orcamento)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [atual] = await query("SELECT status FROM TAB_ORCAMENTO WHERE id = $1", [id])
  if (atual?.status === "convertido") {
    return NextResponse.json(
      { erro: "Nao e possivel excluir um orcamento ja convertido em venda" },
      { status: 409 }
    )
  }

  await query("DELETE FROM TAB_ORCAMENTO WHERE id = $1", [id])
  return NextResponse.json({ sucesso: true })
}
