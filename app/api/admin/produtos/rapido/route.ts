import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { validarCodigoBarras } from "@/lib/codigo-barras"
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

// Cadastro rapido de produto, usado quando o leitor de codigo de barras da
// Venda Balcao nao acha o produto no catalogo - cria so com o minimo pra
// vender na hora (nome, preco, codigo de barras). Fica DE PROPOSITO sem NCM
// (obrigatorio no cadastro completo) - o admin precisa completar depois em
// Produtos, o "incompleto" fica marcado (ncm nulo) pra aparecer na grade.
export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome, preco, codigoBarras, marca } = await request.json()

  if (!nome || !nome.trim() || preco === undefined || preco === null || Number(preco) <= 0) {
    return NextResponse.json({ erro: "Nome e preço são obrigatórios" }, { status: 400 })
  }
  if (!codigoBarras) {
    return NextResponse.json({ erro: "Código de barras é obrigatório" }, { status: 400 })
  }
  if (marca && marca !== "colorido" && marca !== "branco") {
    return NextResponse.json({ erro: "Marca inválida" }, { status: 400 })
  }
  if (!validarCodigoBarras(String(codigoBarras))) {
    return NextResponse.json({ erro: "Código de barras inválido (confira o dígito verificador)" }, { status: 400 })
  }

  const existente = await query("SELECT id FROM TAB_PRODUTO WHERE codigo_barras = $1", [codigoBarras])
  if (existente.length > 0) {
    return NextResponse.json({ erro: "Já existe um produto com esse código de barras" }, { status: 409 })
  }

  let slug = gerarSlug(nome)
  const slugExistente = await query("SELECT id FROM TAB_PRODUTO WHERE slug = $1", [slug])
  if (slugExistente.length > 0) {
    slug = `${slug}-${Date.now().toString().slice(-5)}`
  }

  const [produto] = await query(
    `INSERT INTO TAB_PRODUTO (nome, slug, preco, estoque, codigo_barras, ativo, marca)
     VALUES ($1, $2, $3, 1, $4, true, $5)
     RETURNING id, nome, slug, preco, preco_promocional, estoque, codigo_barras, marca`,
    [nome.trim(), slug, Number(preco), codigoBarras, marca || "colorido"]
  )

  return NextResponse.json(produto, { status: 201 })
}
