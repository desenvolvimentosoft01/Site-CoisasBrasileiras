import { query } from "@/lib/db"
import { resolverMarca } from "@/lib/marca"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const marca = resolverMarca(request.headers.get("host"))
  const banners = await query(
    "SELECT id, titulo, subtitulo, link, imagem_url, cor_fundo FROM TAB_BANNER WHERE ativo = true AND marca = $1 ORDER BY ordem",
    [marca]
  )
  return NextResponse.json(banners)
}
