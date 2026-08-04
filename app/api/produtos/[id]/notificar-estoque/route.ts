import { query } from "@/lib/db"
import { NextResponse } from "next/server"

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Publica de proposito (nao exige login) - qualquer visitante pode deixar o
// email num produto esgotado. ON CONFLICT reseta notificado_em pra NULL: se
// o produto ja voltou e esgotou de novo, a pessoa volta a ficar na fila.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { email } = await request.json()

  if (!email || !REGEX_EMAIL.test(email)) {
    return NextResponse.json({ erro: "E-mail inválido" }, { status: 400 })
  }

  const [produto] = await query("SELECT id, estoque FROM TAB_PRODUTO WHERE id = $1 AND ativo = true", [id])
  if (!produto) {
    return NextResponse.json({ erro: "Produto não encontrado" }, { status: 404 })
  }
  if (Number(produto.estoque) > 0) {
    return NextResponse.json({ erro: "Este produto já está disponível" }, { status: 409 })
  }

  await query(
    `INSERT INTO TAB_NOTIFICACAO_ESTOQUE (produto_id, email)
     VALUES ($1, $2)
     ON CONFLICT (produto_id, email) DO UPDATE SET notificado_em = NULL`,
    [id, String(email).trim().toLowerCase()]
  )

  return NextResponse.json({ sucesso: true })
}
