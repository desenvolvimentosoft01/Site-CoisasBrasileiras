import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const [vendasPorDia, produtosMaisVendidos, [resumo]] = await Promise.all([
    query(`
      SELECT to_char(criado_em, 'YYYY-MM-DD') AS dia, SUM(total) AS total
      FROM TAB_PEDIDO
      WHERE status = 'pago' AND criado_em >= NOW() - INTERVAL '30 days'
      GROUP BY dia
      ORDER BY dia
    `),
    query(`
      SELECT p.nome, SUM(pi.quantidade) AS quantidade, SUM(pi.quantidade * pi.preco_unitario) AS faturamento
      FROM TAB_PEDIDO_ITEM pi
      JOIN TAB_PEDIDO ped ON ped.id = pi.pedido_id
      JOIN TAB_PRODUTO p ON p.id = pi.produto_id
      WHERE ped.status = 'pago'
      GROUP BY p.id, p.nome
      ORDER BY quantidade DESC
      LIMIT 10
    `),
    query(`
      SELECT
        COUNT(*) AS total_pedidos,
        COALESCE(SUM(total), 0) AS faturamento_total,
        COALESCE(AVG(total), 0) AS ticket_medio
      FROM TAB_PEDIDO
      WHERE status = 'pago'
    `),
  ])

  return NextResponse.json({ vendasPorDia, produtosMaisVendidos, resumo })
}
