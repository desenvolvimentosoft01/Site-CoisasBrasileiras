import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Usado so pra recarregar a grade de vendas apos finalizar uma venda balcao -
// a carga inicial da tela vem do Server Component (page.tsx).
export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const vendas = await query(`
    SELECT p.id, p.origem, p.canal, p.marca, p.status, p.total, p.forma_pagamento, p.criado_em,
      COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente avulso') AS cliente_nome
    FROM TAB_PEDIDO p
    LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
    ORDER BY p.criado_em DESC
    LIMIT 100
  `)

  return NextResponse.json(vendas)
}
