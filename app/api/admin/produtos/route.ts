import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

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
      p.id, p.nome, p.slug, p.sku, p.preco, p.preco_promocional, p.estoque, p.estoque_minimo,
      p.ativo, p.criado_em,
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

  const {
    nome,
    descricao,
    preco,
    precoPromocional,
    estoque,
    estoqueMinimo,
    sku,
    pesoKg,
    alturaCm,
    larguraCm,
    comprimentoCm,
    categoriaIds,
    imagensUrls,
  } = await request.json()

  if (!nome || !nome.trim() || preco === undefined || preco === null) {
    return NextResponse.json({ erro: "Nome e preco sao obrigatorios" }, { status: 400 })
  }

  const slug = gerarSlug(nome)

  if (sku) {
    const existente = await query("SELECT id FROM TAB_PRODUTO WHERE sku = $1", [sku])
    if (existente.length > 0) {
      return NextResponse.json({ erro: "Ja existe um produto com esse SKU" }, { status: 409 })
    }
  }

  const [produto] = await query(
    `INSERT INTO TAB_PRODUTO
       (nome, slug, descricao, preco, preco_promocional, estoque, estoque_minimo, sku, peso_kg, altura_cm, largura_cm, comprimento_cm)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, nome, slug, preco, preco_promocional, estoque, ativo, criado_em`,
    [
      nome.trim(),
      slug,
      descricao || null,
      preco,
      precoPromocional || null,
      estoque || 0,
      estoqueMinimo || 0,
      sku || null,
      pesoKg || null,
      alturaCm || null,
      larguraCm || null,
      comprimentoCm || null,
    ]
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

  revalidatePath("/", "layout")

  return NextResponse.json(produto, { status: 201 })
}
