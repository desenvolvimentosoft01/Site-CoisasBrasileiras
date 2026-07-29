import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

const TIPOS_VALIDOS = ["imagem", "video_link", "video_arquivo"]

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const midias = await query("SELECT * FROM TAB_SOBRE_NOS_MIDIA ORDER BY ordem")
  return NextResponse.json(midias)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { tipo, url, legenda, ordem } = await request.json()

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json({ erro: "Tipo invalido" }, { status: 400 })
  }
  if (!url || !url.trim()) {
    return NextResponse.json({ erro: "URL e obrigatoria" }, { status: 400 })
  }

  const [midia] = await query(
    `INSERT INTO TAB_SOBRE_NOS_MIDIA (tipo, url, legenda, ordem)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [tipo, url.trim(), legenda || null, ordem || 0]
  )

  revalidatePath("/", "layout")

  return NextResponse.json(midia, { status: 201 })
}
