import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [compra] = await query(
    `SELECT c.id, c.fornecedor_id, c.numero_nota, c.status, c.valor_frete, c.data_compra,
            c.observacao, c.conta_id, c.criado_em, f.razao_social AS fornecedor_nome
     FROM TAB_COMPRA c JOIN TAB_FORNECEDOR f ON f.id = c.fornecedor_id
     WHERE c.id = $1`,
    [id]
  )

  if (!compra) {
    return NextResponse.json({ erro: "Compra nao encontrada" }, { status: 404 })
  }

  const itens = await query(
    `SELECT ci.id, ci.produto_id, ci.quantidade, ci.custo_unitario, p.nome AS produto_nome
     FROM TAB_COMPRA_ITEM ci JOIN TAB_PRODUTO p ON p.id = ci.produto_id
     WHERE ci.compra_id = $1`,
    [id]
  )

  return NextResponse.json({ ...compra, itens })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [compra] = await query("SELECT status FROM TAB_COMPRA WHERE id = $1", [id])
  if (!compra) {
    return NextResponse.json({ erro: "Compra nao encontrada" }, { status: 404 })
  }
  if (compra.status === "recebida") {
    return NextResponse.json(
      { erro: "Compra ja recebida nao pode ser excluida (ja afetou estoque/custo/financeiro). Use cancelar se aplicavel." },
      { status: 409 }
    )
  }

  await query("DELETE FROM TAB_COMPRA WHERE id = $1", [id])
  return NextResponse.json({ sucesso: true })
}
