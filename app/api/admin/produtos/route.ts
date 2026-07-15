import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

function gerarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const produtos = await query(`
    SELECT
      p.id, p.nome, p.slug, p.preco, p.preco_promocional, p.estoque, p.ativo, p.criado_em,
      COALESCE(
        json_agg(DISTINCT c.nome) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS categorias
    FROM TAB_PRODUTO p
    LEFT JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id
    LEFT JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id
    GROUP BY p.id
    ORDER BY p.criado_em DESC
  `)

  return NextResponse.json(produtos)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome, descricao, preco, precoPromocional, estoque, categoriaIds, imagensUrls } =
    await request.json()

  if (!nome || !nome.trim() || preco === undefined || preco === null) {
    return NextResponse.json({ erro: "Nome e preco sao obrigatorios" }, { status: 400 })
  }

  const slug = gerarSlug(nome)

  const [produto] = await query(
    `INSERT INTO TAB_PRODUTO (nome, slug, descricao, preco, preco_promocional, estoque)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nome, slug, preco, preco_promocional, estoque, ativo, criado_em`,
    [nome.trim(), slug, descricao || null, preco, precoPromocional || null, estoque || 0]
  )

  if (Array.isArray(categoriaIds) && categoriaIds.length > 0) {
    for (const categoriaId of categoriaIds) {
      await query(
        "INSERT INTO TAB_PRODUTO_CATEGORIA (produto_id, categoria_id) VALUES ($1, $2)",
        [produto.id, categoriaId]
      )
    }
  }

  if (Array.isArray(imagensUrls) && imagensUrls.length > 0) {
    for (let i = 0; i < imagensUrls.length; i++) {
      await query(
        "INSERT INTO TAB_PRODUTO_IMAGEM (produto_id, url, ordem) VALUES ($1, $2, $3)",
        [produto.id, imagensUrls[i], i]
      )
    }
  }

  return NextResponse.json(produto, { status: 201 })
}
