import { transacao, query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

type ItemCotacao = {
  produtoId?: string | null
  descricao: string
  quantidade: number
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [cotacao] = await query(
    `SELECT ct.id, ct.numero, ct.status, ct.observacao, ct.token_resposta, ct.enviado_email_em,
       ct.respondido_em, ct.pedido_compra_id, ct.criado_em, ct.fornecedor_id,
       f.razao_social AS fornecedor_nome, f.email AS fornecedor_email, f.telefone AS fornecedor_telefone
     FROM TAB_COTACAO ct
     JOIN TAB_FORNECEDOR f ON f.id = ct.fornecedor_id
     WHERE ct.id = $1`,
    [id]
  )
  if (!cotacao) {
    return NextResponse.json({ erro: "Cotação não encontrada" }, { status: 404 })
  }

  const itens = await query(
    `SELECT id, produto_id, descricao, quantidade_solicitada, quantidade_cotada, valor_unitario_cotado
     FROM TAB_COTACAO_ITEM WHERE cotacao_id = $1 ORDER BY id`,
    [id]
  )

  return NextResponse.json({ ...cotacao, itens })
}

// So permite editar enquanto "aberto" (antes de mandar pro fornecedor).
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
    itens: ItemCotacao[]
  } = await request.json()

  if (!fornecedorId) {
    return NextResponse.json({ erro: "Fornecedor é obrigatório" }, { status: 400 })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Adicione pelo menos um item" }, { status: 400 })
  }

  const [atual] = await query("SELECT status FROM TAB_COTACAO WHERE id = $1", [id])
  if (!atual) {
    return NextResponse.json({ erro: "Cotação não encontrada" }, { status: 404 })
  }
  if (atual.status !== "aberto") {
    return NextResponse.json({ erro: "Só é possível editar cotações em aberto" }, { status: 400 })
  }

  const cotacao = await transacao(async (executar) => {
    const [atualizada] = await executar(
      `UPDATE TAB_COTACAO SET fornecedor_id = $1, observacao = $2, atualizado_em = NOW()
       WHERE id = $3
       RETURNING id, numero, status, observacao, criado_em`,
      [fornecedorId, observacao || null, id]
    )

    await executar("DELETE FROM TAB_COTACAO_ITEM WHERE cotacao_id = $1", [id])
    for (const item of itens) {
      await executar(
        `INSERT INTO TAB_COTACAO_ITEM (cotacao_id, produto_id, descricao, quantidade_solicitada)
         VALUES ($1, $2, $3, $4)`,
        [id, item.produtoId || null, item.descricao, item.quantidade]
      )
    }

    return atualizada
  })

  return NextResponse.json(cotacao)
}

const STATUS_VALIDOS = ["cancelada", "recusada"]

// So aceita cancelar (enquanto nao atendida) ou recusar (depois de
// respondida) manualmente - "aceita" so acontece via /aceitar (rota
// separada, que de fato gera o pedido de compra).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { status } = await request.json()

  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ erro: "Status inválido" }, { status: 400 })
  }

  const [atual] = await query("SELECT status FROM TAB_COTACAO WHERE id = $1", [id])
  if (!atual) {
    return NextResponse.json({ erro: "Cotação não encontrada" }, { status: 404 })
  }
  if (atual.status === "aceita") {
    return NextResponse.json({ erro: "Cotação já aceita (pedido de compra gerado)" }, { status: 400 })
  }

  const [cotacao] = await query(
    "UPDATE TAB_COTACAO SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING id, status",
    [status, id]
  )
  return NextResponse.json(cotacao)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [atual] = await query("SELECT status FROM TAB_COTACAO WHERE id = $1", [id])
  if (atual?.status === "aceita") {
    return NextResponse.json({ erro: "Não é possível excluir uma cotação já aceita" }, { status: 409 })
  }

  await query("DELETE FROM TAB_COTACAO WHERE id = $1", [id])
  return NextResponse.json({ sucesso: true })
}
