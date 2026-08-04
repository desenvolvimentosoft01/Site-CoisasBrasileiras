import { query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// So quem tem pedido pago com o produto pode avaliar - evita avaliacao falsa
// de quem nunca comprou.
async function clienteComprouProduto(clienteId: string, produtoId: string): Promise<boolean> {
  const [linha] = await query(
    `SELECT 1 FROM TAB_PEDIDO_ITEM pi
     JOIN TAB_PEDIDO p ON p.id = pi.pedido_id
     WHERE p.cliente_id = $1 AND pi.produto_id = $2 AND p.status = 'pago'
     LIMIT 1`,
    [clienteId, produtoId]
  )
  return Boolean(linha)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { produtoId, nota, comentario } = await request.json()

  if (!produtoId || !(Number(nota) >= 1 && Number(nota) <= 5)) {
    return NextResponse.json({ erro: "Nota inválida" }, { status: 400 })
  }

  const comprou = await clienteComprouProduto(sessaoOuErro.id, produtoId)
  if (!comprou) {
    return NextResponse.json(
      { erro: "Só quem comprou o produto (pedido pago) pode avaliá-lo" },
      { status: 403 }
    )
  }

  try {
    const [avaliacao] = await query(
      `INSERT INTO TAB_AVALIACAO_PRODUTO (produto_id, cliente_id, nota, comentario)
       VALUES ($1, $2, $3, $4)
       RETURNING id, aprovado`,
      [produtoId, sessaoOuErro.id, Number(nota), comentario || null]
    )
    return NextResponse.json(avaliacao, { status: 201 })
  } catch (erro) {
    // 23505 = ja existe avaliacao desse cliente pra esse produto (UNIQUE)
    if (erro instanceof Error && "code" in erro && erro.code === "23505") {
      return NextResponse.json({ erro: "Você já avaliou este produto" }, { status: 409 })
    }
    throw erro
  }
}
