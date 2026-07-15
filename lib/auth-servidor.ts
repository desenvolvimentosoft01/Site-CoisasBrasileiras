import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { lerTokenSessao, type SessaoAdmin } from "@/lib/auth"

// Helper para rotas de API do admin: retorna a sessao valida ou uma
// NextResponse 401 pronta para ser devolvida direto pela rota.
export async function exigirSessao(): Promise<SessaoAdmin | NextResponse> {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessao(cookieStore.get("admin_sessao")?.value)

  if (!sessao) {
    return NextResponse.json({ erro: "Nao autenticado" }, { status: 401 })
  }

  return sessao
}
