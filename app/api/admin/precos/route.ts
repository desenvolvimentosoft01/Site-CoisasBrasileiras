import { query, transacao } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// Lista de produtos com preco e custo, pra tela de reajuste em massa montar a
// pre-visualizacao antes de aplicar qualquer alteracao.
export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const produtos = await query(`
    SELECT
      p.id, p.nome, p.sku, p.preco, p.preco_promocional, p.custo, p.ativo,
      COALESCE(json_agg(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL), '[]') AS categoria_ids
    FROM TAB_PRODUTO p
    LEFT JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id
    LEFT JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id
    GROUP BY p.id
    ORDER BY p.nome
  `)

  return NextResponse.json(produtos)
}

// Aplica o reajuste em lote. Recebe a lista final de precos calculados pelo
// client (nao o percentual) - assim o que o admin viu na pre-visualizacao e
// exatamente o que e gravado, sem risco de arredondamento diferente entre
// tela e servidor.
export async function PUT(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { itens } = await request.json()

  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Nenhum item para atualizar" }, { status: 400 })
  }

  for (const item of itens) {
    if (!item.id || typeof item.preco !== "number" || item.preco <= 0) {
      return NextResponse.json({ erro: "Item invalido na lista de reajuste" }, { status: 400 })
    }
  }

  await transacao(async (q) => {
    for (const item of itens) {
      await q(
        `UPDATE TAB_PRODUTO
         SET preco = $1, preco_promocional = $2, atualizado_em = NOW()
         WHERE id = $3`,
        [item.preco, item.precoPromocional ?? null, item.id]
      )
    }
  })

  revalidatePath("/", "layout")

  return NextResponse.json({ sucesso: true, atualizados: itens.length })
}
