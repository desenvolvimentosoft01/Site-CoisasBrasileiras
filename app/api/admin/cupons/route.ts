import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const cupons = await query("SELECT * FROM TAB_CUPOM ORDER BY criado_em DESC")
  return NextResponse.json(cupons)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { codigo, tipo, valor, valorMinimo, primeiraCompraApenas, validade, usoMaximo } =
    await request.json()

  if (!codigo || !codigo.trim() || !valor) {
    return NextResponse.json({ erro: "Código e valor são obrigatórios" }, { status: 400 })
  }

  const codigoNormalizado = codigo.trim().toUpperCase()

  const existente = await query("SELECT id FROM TAB_CUPOM WHERE codigo = $1", [codigoNormalizado])
  if (existente.length > 0) {
    return NextResponse.json({ erro: "Já existe um cupom com esse código" }, { status: 409 })
  }

  const [cupom] = await query(
    `INSERT INTO TAB_CUPOM (codigo, tipo, valor, valor_minimo, primeira_compra_apenas, validade, uso_maximo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      codigoNormalizado,
      tipo || "percentual",
      valor,
      valorMinimo || 0,
      primeiraCompraApenas ?? false,
      validade || null,
      usoMaximo || null,
    ]
  )

  return NextResponse.json(cupom, { status: 201 })
}
