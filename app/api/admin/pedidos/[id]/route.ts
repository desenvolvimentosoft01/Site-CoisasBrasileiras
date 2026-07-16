import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

const STATUS_VALIDOS = [
  "aguardando_pagamento",
  "pago",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
]

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [pedido] = await query(
    `
    SELECT
      p.id, p.status, p.total, p.forma_pagamento, p.nota_fiscal_url, p.criado_em,
      c.nome AS cliente_nome, c.email AS cliente_email, c.telefone AS cliente_telefone,
      e.cep, e.logradouro, e.numero, e.complemento, e.bairro, e.cidade, e.estado
    FROM TAB_PEDIDO p
    JOIN TAB_CLIENTE c ON c.id = p.cliente_id
    JOIN TAB_ENDERECO e ON e.id = p.endereco_id
    WHERE p.id = $1
    `,
    [id]
  )

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido nao encontrado" }, { status: 404 })
  }

  const itens = await query(
    `SELECT pi.quantidade, pi.preco_unitario, pr.nome AS produto_nome
     FROM TAB_PEDIDO_ITEM pi
     JOIN TAB_PRODUTO pr ON pr.id = pi.produto_id
     WHERE pi.pedido_id = $1`,
    [id]
  )

  return NextResponse.json({ ...pedido, itens })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { status } = await request.json()

  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ erro: "Status invalido" }, { status: 400 })
  }

  const [pedido] = await query(
    "UPDATE TAB_PEDIDO SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING id, status",
    [status, id]
  )

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(pedido)
}
