import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

const REGIOES_VALIDAS = ["norte", "nordeste", "centro_oeste", "sudeste", "sul"]

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const faixas = await query(
    `SELECT id, regiao, peso_min_kg, peso_max_kg, valor, prazo_dias
     FROM TAB_FRETE_FAIXA
     ORDER BY regiao, peso_min_kg`
  )
  return NextResponse.json(faixas)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { regiao, pesoMinKg, pesoMaxKg, valor, prazoDias } = await request.json()

  if (!REGIOES_VALIDAS.includes(regiao)) {
    return NextResponse.json({ erro: "Região inválida" }, { status: 400 })
  }
  if (pesoMinKg === undefined || pesoMaxKg === undefined || Number(pesoMaxKg) <= Number(pesoMinKg)) {
    return NextResponse.json({ erro: "Faixa de peso inválida" }, { status: 400 })
  }
  if (!valor || Number(valor) <= 0) {
    return NextResponse.json({ erro: "Valor é obrigatório" }, { status: 400 })
  }

  try {
    const [faixa] = await query(
      `INSERT INTO TAB_FRETE_FAIXA (regiao, peso_min_kg, peso_max_kg, valor, prazo_dias)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, regiao, peso_min_kg, peso_max_kg, valor, prazo_dias`,
      [regiao, pesoMinKg, pesoMaxKg, valor, prazoDias || 7]
    )
    return NextResponse.json(faixa, { status: 201 })
  } catch (erro) {
    if (erro instanceof Error && "code" in erro && erro.code === "23505") {
      return NextResponse.json(
        { erro: "Já existe uma faixa igual (mesma região e peso) cadastrada" },
        { status: 409 }
      )
    }
    throw erro
  }
}
