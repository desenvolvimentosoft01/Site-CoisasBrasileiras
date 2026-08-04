import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { titulo, subtitulo, link, imagemUrl, corFundo, ordem, ativo } = await request.json()

  if (!titulo || !titulo.trim()) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 })
  }

  const [banner] = await query(
    `UPDATE TAB_BANNER
     SET titulo = $1, subtitulo = $2, link = $3, imagem_url = $4, cor_fundo = $5, ordem = $6, ativo = $7
     WHERE id = $8
     RETURNING *`,
    [
      titulo.trim(),
      subtitulo || null,
      link || null,
      imagemUrl || null,
      corFundo || "from-emerald-700 to-emerald-900",
      ordem || 0,
      ativo ?? true,
      id,
    ]
  )

  if (!banner) {
    return NextResponse.json({ erro: "Banner não encontrado" }, { status: 404 })
  }

  revalidatePath("/", "layout")

  return NextResponse.json(banner)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  await query("DELETE FROM TAB_BANNER WHERE id = $1", [id])

  revalidatePath("/", "layout")

  return NextResponse.json({ sucesso: true })
}
