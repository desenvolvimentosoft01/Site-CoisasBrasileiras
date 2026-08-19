import { exigirAdmin } from "@/lib/auth-servidor"
import { montarUrlAutorizacaoBling } from "@/lib/bling"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

// Inicia o fluxo OAuth do Bling - so o admin pode conectar a conta da loja.
// O "state" e um valor aleatorio que o callback confere, pra garantir que a
// resposta do Bling corresponde a uma conexao que realmente comecamos aqui
// (protege contra CSRF nesse fluxo).
export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  const redirectUri = `${siteUrl}/api/admin/bling/callback`
  const state = randomBytes(16).toString("hex")

  let url: string
  try {
    url = await montarUrlAutorizacaoBling(redirectUri, state)
  } catch {
    // Credenciais do Bling ainda nao configuradas (banco ou variavel de
    // ambiente) - volta pra Configuracoes com mensagem amigavel em vez de
    // estourar erro 500.
    return NextResponse.redirect(`${siteUrl}/admin/configuracoes?aba=integracoes&bling=erro_nao_configurado`)
  }

  const resposta = NextResponse.redirect(url)
  resposta.cookies.set("bling_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  })
  return resposta
}
