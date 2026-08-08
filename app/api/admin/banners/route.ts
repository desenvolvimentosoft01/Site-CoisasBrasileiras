import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const banners = await query("SELECT * FROM TAB_BANNER ORDER BY ordem")
  return NextResponse.json(banners)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { titulo, subtitulo, link, imagemUrl, corFundo, ordem, marca } = await request.json()

  if (!titulo || !titulo.trim()) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 })
  }
  if (marca && marca !== "colorido" && marca !== "branco") {
    return NextResponse.json({ erro: "Marca inválida" }, { status: 400 })
  }

  const [banner] = await query(
    `INSERT INTO TAB_BANNER (titulo, subtitulo, link, imagem_url, cor_fundo, ordem, marca)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      titulo.trim(),
      subtitulo || null,
      link || null,
      imagemUrl || null,
      corFundo || "from-emerald-700 to-emerald-900",
      ordem || 0,
      marca || "colorido",
    ]
  )

  revalidatePath("/", "layout")

  return NextResponse.json(banner, { status: 201 })
}
