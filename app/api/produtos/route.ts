import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoriaSlug = searchParams.get("categoria")

  const filtroCategoria = categoriaSlug
    ? "AND c.slug = $1"
    : ""
  const parametros = categoriaSlug ? [categoriaSlug] : []

  const produtos = await query(
    `
    SELECT
      p.id, p.nome, p.slug, p.preco, p.preco_promocional, p.estoque,
      (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_capa
    FROM TAB_PRODUTO p
    ${categoriaSlug ? "JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id" : ""}
    WHERE p.ativo = true ${filtroCategoria}
    GROUP BY p.id
    ORDER BY p.criado_em DESC
    `,
    parametros
  )

  return NextResponse.json(produtos)
}
