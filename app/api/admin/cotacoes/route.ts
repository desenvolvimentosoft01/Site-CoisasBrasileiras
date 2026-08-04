import { transacao, query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

type ItemCotacao = {
  produtoId?: string | null
  descricao: string
  quantidade: number
}

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const cotacoes = await query(
    `SELECT ct.id, ct.numero, ct.status, ct.observacao, ct.token_resposta, ct.enviado_email_em,
       ct.respondido_em, ct.pedido_compra_id, ct.criado_em, ct.fornecedor_id,
       f.razao_social AS fornecedor_nome, f.email AS fornecedor_email, f.telefone AS fornecedor_telefone
     FROM TAB_COTACAO ct
     JOIN TAB_FORNECEDOR f ON f.id = ct.fornecedor_id
     ORDER BY ct.criado_em DESC`
  )
  return NextResponse.json(cotacoes)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

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

  const cotacao = await transacao(async (executar) => {
    const [criada] = await executar(
      `INSERT INTO TAB_COTACAO (fornecedor_id, observacao)
       VALUES ($1, $2)
       RETURNING id, numero, status, observacao, token_resposta, criado_em`,
      [fornecedorId, observacao || null]
    )

    for (const item of itens) {
      await executar(
        `INSERT INTO TAB_COTACAO_ITEM (cotacao_id, produto_id, descricao, quantidade_solicitada)
         VALUES ($1, $2, $3, $4)`,
        [criada.id, item.produtoId || null, item.descricao, item.quantidade]
      )
    }

    return criada
  })

  return NextResponse.json(cotacao, { status: 201 })
}
