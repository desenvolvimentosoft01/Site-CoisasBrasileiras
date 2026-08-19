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

  // O Bling volta com "error" (sem "code") quando ele mesmo recusa a
  // autorizacao - client_id desconhecido, redirect_uri diferente do cadastrado
  // no app, ou consentimento negado. Isso nao e problema de state: sem separar
  // os dois casos, o admin ve "state invalido" e vai procurar no lugar errado.
  const erroBling = searchParams.get("error")
  if (erroBling) {
    const detalhe = searchParams.get("error_description") || erroBling
    return NextResponse.redirect(
      `${siteUrl}/admin/configuracoes?aba=integracoes&bling=erro_autorizacao&detalhe=${encodeURIComponent(detalhe)}`
    )
  }

  const cookieHeader = request.headers.get("cookie") || ""
  const stateSalvo = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("bling_oauth_state="))
    ?.split("=")[1]

  if (!code || !state || !stateSalvo || state !== stateSalvo) {
    return NextResponse.redirect(`${siteUrl}/admin/configuracoes?aba=integracoes&bling=erro_state`)
  }

  try {
    await trocarCodigoPorTokenBling(code, `${siteUrl}/api/admin/bling/callback`)
    return NextResponse.redirect(`${siteUrl}/admin/configuracoes?aba=integracoes&bling=conectado`)
  } catch {
    return NextResponse.redirect(`${siteUrl}/admin/configuracoes?aba=integracoes&bling=erro_token`)
  }
}
