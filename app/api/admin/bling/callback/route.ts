import { exigirAdmin } from "@/lib/auth-servidor"
import { trocarCodigoPorTokenBling } from "@/lib/bling"
import { NextResponse } from "next/server"

// Callback do OAuth do Bling - recebe o "code" e troca pelos tokens de
// acesso. Confere o "state" contra o cookie salvo em /conectar antes de
// aceitar, pra garantir que essa resposta corresponde a uma conexao que a
// gente mesmo iniciou, e exige sessao de admin como camada extra de defesa
// (mesmo o state ja sendo httpOnly e praticamente infalsificavel de fora).
export async function GET(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) {
    return NextResponse.redirect(`${siteUrl}/admin/entrar`)
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  const cookieHeader = request.headers.get("cookie") || ""
  const stateSalvo = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("bling_oauth_state="))
    ?.split("=")[1]

  if (!code || !state || !stateSalvo || state !== stateSalvo) {
    return NextResponse.redirect(`${siteUrl}/admin/configuracoes?bling=erro_state`)
  }

  try {
    await trocarCodigoPorTokenBling(code, `${siteUrl}/api/admin/bling/callback`)
    return NextResponse.redirect(`${siteUrl}/admin/configuracoes?bling=conectado`)
  } catch {
    return NextResponse.redirect(`${siteUrl}/admin/configuracoes?bling=erro_token`)
  }
}
