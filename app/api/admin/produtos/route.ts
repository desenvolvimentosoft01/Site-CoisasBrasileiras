import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { validarCodigoBarras } from "@/lib/codigo-barras"
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
      p.id, p.codigo, p.nome, p.slug, p.sku, p.ncm, p.codigo_barras, p.codigo_barras_interno,
      p.preco, p.preco_promocional, p.estoque, p.estoque_minimo,
      p.ativo, p.marca, p.criado_em,
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
    ncm,
    codigoBarras,
    codigoBarrasInterno,
    precoClube,
    precoClubeTipo,
    marca,
    categoriaIds,
    imagensUrls,
  } = await request.json()

  if (!nome || !nome.trim() || preco === undefined || preco === null) {
    return NextResponse.json({ erro: "Nome e preço são obrigatórios" }, { status: 400 })
  }
  if (marca && marca !== "colorido" && marca !== "branco") {
    return NextResponse.json({ erro: "Marca inválida" }, { status: 400 })
  }
  if (precoClubeTipo && precoClubeTipo !== "fixo" && precoClubeTipo !== "percentual") {
    return NextResponse.json({ erro: "Tipo do preço do Clube inválido" }, { status: 400 })
  }
  // Codigo de barras deixou de ser obrigatorio (migration 056): produto
  // artesanal e importado costuma nao ter GTIN do fabricante. Quando vem
  // preenchido, continua sendo validado - codigo invalido e pior que
  // nenhum, porque a Sefaz rejeita a nota.
  if (codigoBarras && String(codigoBarras).trim() && !validarCodigoBarras(String(codigoBarras))) {
    return NextResponse.json({ erro: "Código de barras inválido (precisa ser EAN-13/EAN-8 com dígito verificador correto)" }, { status: 400 })
  }
  if (!ncm || !String(ncm).trim()) {
    return NextResponse.json({ erro: "NCM é obrigatório" }, { status: 400 })
  }

  const slug = gerarSlug(nome)

  if (sku) {
    const existente = await query("SELECT id FROM TAB_PRODUTO WHERE sku = $1", [sku])
    if (existente.length > 0) {
      return NextResponse.json({ erro: "Já existe um produto com esse SKU" }, { status: 409 })
    }
  }

  const [produto] = await query(
    `INSERT INTO TAB_PRODUTO
       (nome, slug, descricao, preco, preco_promocional, preco_clube, preco_clube_tipo, estoque, estoque_minimo, sku, peso_kg, altura_cm, largura_cm, comprimento_cm, ncm, codigo_barras, marca, codigo_barras_interno)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING id, codigo, nome, slug, preco, preco_promocional, estoque, ativo, marca, criado_em`,
    [
      nome.trim(),
      slug,
      descricao || null,
      preco,
      precoPromocional || null,
      precoClube || null,
      precoClubeTipo || "fixo",
      estoque || 0,
      estoqueMinimo || 0,
      sku || null,
      pesoKg || null,
      alturaCm || null,
      larguraCm || null,
      comprimentoCm || null,
      ncm || null,
      codigoBarras || null,
      marca || "colorido",
      codigoBarrasInterno === true,
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
