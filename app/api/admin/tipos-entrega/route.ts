import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const tipos = await query(
    "SELECT id, nome, ativo, criado_em FROM TAB_TIPO_ENTREGA ORDER BY nome"
  )
  return NextResponse.json(tipos)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome } = await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 })
  }

  try {
    const [tipo] = await query(
      "INSERT INTO TAB_TIPO_ENTREGA (nome) VALUES ($1) RETURNING id, nome, ativo, criado_em",
      [nome.trim()]
    )
    return NextResponse.json(tipo, { status: 201 })
  } catch (erro) {
    if (erro instanceof Error && "code" in erro && erro.code === "23505") {
      return NextResponse.json({ erro: "Já existe um tipo de entrega com esse nome" }, { status: 409 })
    }
    throw erro
  }
}
