import { query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Diz pro front se mostra o formulario de avaliacao: precisa ter comprado
// (pedido pago) e ainda nao ter avaliado esse produto.
export async function GET(_request: Request, { params }: { params: Promise<{ produtoId: string }> }) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { produtoId } = await params

  const [comprou] = await query(
    `SELECT 1 FROM TAB_PEDIDO_ITEM pi
     JOIN TAB_PEDIDO p ON p.id = pi.pedido_id
     WHERE p.cliente_id = $1 AND pi.produto_id = $2 AND p.status = 'pago'
     LIMIT 1`,
    [sessaoOuErro.id, produtoId]
  )

  const [avaliacaoExistente] = await query(
    "SELECT id, aprovado FROM TAB_AVALIACAO_PRODUTO WHERE produto_id = $1 AND cliente_id = $2",
    [produtoId, sessaoOuErro.id]
  )

  return NextResponse.json({
    comprou: Boolean(comprou),
    jaAvaliou: Boolean(avaliacaoExistente),
    avaliacaoAprovada: avaliacaoExistente?.aprovado ?? null,
  })
}
