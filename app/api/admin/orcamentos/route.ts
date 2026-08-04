import { transacao, query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

type ItemOrcamento = {
  produtoId?: string | null
  descricao: string
  quantidade: number
  valorUnitario: number
}

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const orcamentos = await query(
    `SELECT id, numero, titulo, cliente_id, cliente_nome, cliente_telefone, cliente_email,
       status, subtotal, desconto, total, pedido_id, token_aprovacao, canal_resposta,
       observacao_cliente, enviado_email_em, respondido_em, criado_em
     FROM TAB_ORCAMENTO
     ORDER BY criado_em DESC`
  )
  return NextResponse.json(orcamentos)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

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

  const subtotal = itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0)
  const valorDesconto = Math.min(Number(desconto) || 0, subtotal)
  const total = subtotal - valorDesconto

  const orcamento = await transacao(async (executar) => {
    const [criado] = await executar(
      `INSERT INTO TAB_ORCAMENTO
         (titulo, cliente_id, cliente_nome, cliente_telefone, cliente_email, condicoes, subtotal, desconto, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      ]
    )

    for (const item of itens) {
      await executar(
        `INSERT INTO TAB_ORCAMENTO_ITEM
           (orcamento_id, produto_id, descricao, quantidade, valor_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          criado.id,
          item.produtoId || null,
          item.descricao,
          item.quantidade,
          item.valorUnitario,
          item.quantidade * item.valorUnitario,
        ]
      )
    }

    return criado
  })

  return NextResponse.json(orcamento, { status: 201 })
}
