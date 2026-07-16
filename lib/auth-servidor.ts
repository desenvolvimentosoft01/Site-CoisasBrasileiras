import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  lerTokenSessao,
  lerTokenSessaoCliente,
  type SessaoAdmin,
  type SessaoCliente,
} from "@/lib/auth"

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

// Mesma ideia, mas para rotas do cliente final (checkout, area do cliente).
export async function exigirSessaoCliente(): Promise<SessaoCliente | NextResponse> {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessaoCliente(cookieStore.get("cliente_sessao")?.value)

  if (!sessao) {
    return NextResponse.json({ erro: "Nao autenticado" }, { status: 401 })
  }

  return sessao
}
