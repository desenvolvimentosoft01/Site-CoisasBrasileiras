import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const feedbacks = await query("SELECT * FROM TAB_FEEDBACK ORDER BY ordem, criado_em DESC")
  return NextResponse.json(feedbacks)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome, texto, imagemUrl, nota, ordem, marca } = await request.json()

  if (!nome || !nome.trim() || !texto || !texto.trim()) {
    return NextResponse.json({ erro: "Nome e texto são obrigatórios" }, { status: 400 })
  }

  const [feedback] = await query(
    `INSERT INTO TAB_FEEDBACK (nome, texto, imagem_url, nota, ordem, marca)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [nome.trim(), texto.trim(), imagemUrl || null, nota || 5, ordem || 0, marca === "branco" ? "branco" : "colorido"]
  )

  revalidatePath("/", "layout")

  return NextResponse.json(feedback, { status: 201 })
}
