import { query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const produtos = await query(
    `SELECT p.id, p.nome, p.slug, p.preco, p.preco_promocional, p.estoque,
            (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_url
     FROM TAB_LISTA_DESEJOS ld
     JOIN TAB_PRODUTO p ON p.id = ld.produto_id
     WHERE ld.cliente_id = $1
     ORDER BY ld.criado_em DESC`,
    [sessaoOuErro.id]
  )

  return NextResponse.json(produtos)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { produtoId } = await request.json()
  if (!produtoId) {
    return NextResponse.json({ erro: "produtoId e obrigatorio" }, { status: 400 })
  }

  await query(
    "INSERT INTO TAB_LISTA_DESEJOS (cliente_id, produto_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [sessaoOuErro.id, produtoId]
  )

  return NextResponse.json({ sucesso: true }, { status: 201 })
}
