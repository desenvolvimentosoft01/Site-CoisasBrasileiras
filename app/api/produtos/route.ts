import { query } from "@/lib/db"
import { resolverMarca } from "@/lib/marca"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoriaSlug = searchParams.get("categoria")
  const marca = resolverMarca(request.headers.get("host"))

  const parametros: string[] = [marca]
  const filtroCategoria = categoriaSlug ? (parametros.push(categoriaSlug), `AND c.slug = $${parametros.length}`) : ""

  const produtos = await query(
    `
    SELECT
      p.id, p.nome, p.slug, p.preco, p.preco_promocional, p.estoque,
      (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_capa
    FROM TAB_PRODUTO p
    ${categoriaSlug ? "JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id" : ""}
    WHERE p.ativo = true AND p.marca = $1 ${filtroCategoria}
    GROUP BY p.id
    ORDER BY p.criado_em DESC
    `,
    parametros
  )

  return NextResponse.json(produtos)
}
