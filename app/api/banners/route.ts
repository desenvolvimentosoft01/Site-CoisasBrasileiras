import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const banners = await query(
    "SELECT id, titulo, subtitulo, link, imagem_url, cor_fundo FROM TAB_BANNER WHERE ativo = true ORDER BY ordem"
  )
  return NextResponse.json(banners)
}
