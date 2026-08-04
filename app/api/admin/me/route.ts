import { lerTokenSessao } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessao(cookieStore.get("admin_sessao")?.value)

  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  return NextResponse.json(sessao)
}
