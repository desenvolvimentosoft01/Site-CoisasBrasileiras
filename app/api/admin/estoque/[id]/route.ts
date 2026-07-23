import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Ajuste rapido de estoque de um produto (usado pela tela de Controle de
// Estoque). So mexe no campo estoque - o cadastro completo do produto continua
// na tela de Produtos. A auditoria e registrada pelo client (registrarAuditoria)
// apos o sucesso, igual as demais telas.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { estoque } = await request.json()

  const novoEstoque = Number(estoque)
  if (!Number.isFinite(novoEstoque) || novoEstoque < 0) {
    return NextResponse.json({ erro: "Estoque invalido" }, { status: 400 })
  }

  const [produto] = await query(
    `UPDATE TAB_PRODUTO SET estoque = $1, atualizado_em = NOW()
     WHERE id = $2
     RETURNING id, nome, estoque, estoque_minimo`,
    [novoEstoque, id]
  )

  if (!produto) {
    return NextResponse.json({ erro: "Produto nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(produto)
}
