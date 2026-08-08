import { query } from "@/lib/db"
import { resolverMarca } from "@/lib/marca"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const marca = resolverMarca(request.headers.get("host"))
  const categorias = await query(
    "SELECT id, nome, slug, categoria_pai_id FROM TAB_CATEGORIA WHERE ativa = true AND marca = $1 ORDER BY nome",
    [marca]
  )
  return NextResponse.json(categorias)
}
