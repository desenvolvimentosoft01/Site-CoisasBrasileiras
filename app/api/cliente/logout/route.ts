import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ sucesso: true })
  response.cookies.set("cliente_sessao", "", { maxAge: 0, path: "/" })
  return response
}
