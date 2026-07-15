import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const categorias = await query(
    "SELECT id, nome, slug FROM TAB_CATEGORIA WHERE ativa = true ORDER BY nome"
  )
  return NextResponse.json(categorias)
}
