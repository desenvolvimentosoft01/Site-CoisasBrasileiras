import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [produto] = await query(
    "SELECT * FROM TAB_PRODUTO WHERE id = $1",
    [id]
  )

  if (!produto) {
    return NextResponse.json({ erro: "Produto nao encontrado" }, { status: 404 })
  }

  const categorias = await query(
    "SELECT categoria_id FROM TAB_PRODUTO_CATEGORIA WHERE produto_id = $1",
    [id]
  )
  const imagens = await query(
    "SELECT id, url, ordem FROM TAB_PRODUTO_IMAGEM WHERE produto_id = $1 ORDER BY ordem",
    [id]
  )

  return NextResponse.json({
    ...produto,
    categoriaIds: categorias.map((c) => c.categoria_id),
    imagens,
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const {
    nome,
    descricao,
    preco,
    precoPromocional,
    estoque,
    estoqueMinimo,
    ativo,
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

  if (sku) {
    const existente = await query("SELECT id FROM TAB_PRODUTO WHERE sku = $1 AND id != $2", [
      sku,
      id,
    ])
    if (existente.length > 0) {
      return NextResponse.json({ erro: "Ja existe um produto com esse SKU" }, { status: 409 })
    }
  }

  const [produto] = await query(
    `UPDATE TAB_PRODUTO
     SET nome = $1, descricao = $2, preco = $3, preco_promocional = $4,
         estoque = $5, estoque_minimo = $6, ativo = $7, sku = $8,
         peso_kg = $9, altura_cm = $10, largura_cm = $11, comprimento_cm = $12,
         atualizado_em = NOW()
     WHERE id = $13
     RETURNING id, nome, slug, preco, preco_promocional, estoque, ativo`,
    [
      nome.trim(),
      descricao || null,
      preco,
      precoPromocional || null,
      estoque || 0,
      estoqueMinimo || 0,
      ativo ?? true,
      sku || null,
      pesoKg || null,
      alturaCm || null,
      larguraCm || null,
      comprimentoCm || null,
      id,
    ]
  )

  if (!produto) {
    return NextResponse.json({ erro: "Produto nao encontrado" }, { status: 404 })
  }

  // Substitui as associacoes por completo em vez de tentar um diff -
  // o volume de categorias/imagens por produto e pequeno, entao o custo e desprezivel.
  await query("DELETE FROM TAB_PRODUTO_CATEGORIA WHERE produto_id = $1", [id])
  if (Array.isArray(categoriaIds)) {
    for (const categoriaId of categoriaIds) {
      await query(
        "INSERT INTO TAB_PRODUTO_CATEGORIA (produto_id, categoria_id) VALUES ($1, $2)",
        [id, categoriaId]
      )
    }
  }

  await query("DELETE FROM TAB_PRODUTO_IMAGEM WHERE produto_id = $1", [id])
  if (Array.isArray(imagensUrls)) {
    for (let i = 0; i < imagensUrls.length; i++) {
      await query(
        "INSERT INTO TAB_PRODUTO_IMAGEM (produto_id, url, ordem) VALUES ($1, $2, $3)",
        [id, imagensUrls[i], i]
      )
    }
  }

  return NextResponse.json(produto)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  await query("DELETE FROM TAB_PRODUTO WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
