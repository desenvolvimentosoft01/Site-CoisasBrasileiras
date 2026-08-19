import { exigirAdmin } from "@/lib/auth-servidor"
import { getSegredo, setSegredo } from "@/lib/segredos"
import { NextResponse } from "next/server"

const CHAVES = [
  "frenet_token",
  "mercadopago_access_token",
  "mercadopago_public_key",
  "mercadopago_webhook_secret",
  "email_user",
  "email_pass",
  "email_notificacoes_admin",
  "bling_client_id",
  "bling_client_secret",
] as const

// So admin - nunca devolve o valor real dos segredos sensiveis (token/senha),
// so se estao configurados ("configurado": true/false) e o quanto der pra
// mostrar sem risco (email_user e email_notificacoes_admin sao enderecos,
// nao segredo em si, entao esses dois voltam completos pra facilitar conferir).
export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const valores = await Promise.all(CHAVES.map((chave) => getSegredo(chave)))
  const mapa: Record<string, { configurado: boolean; valor?: string }> = {}

  CHAVES.forEach((chave, indice) => {
    const valor = valores[indice]
    const ehTextoVisivel =
      chave === "email_user" || chave === "email_notificacoes_admin" || chave === "mercadopago_public_key"
    mapa[chave] = ehTextoVisivel ? { configurado: Boolean(valor), valor: valor || "" } : { configurado: Boolean(valor) }
  })

  // Sem cache no navegador: a tela pergunta "o que ja esta configurado?" e uma
  // resposta guardada mente sobre o estado atual - o cliente configura a
  // integracao e a tela continua dizendo que nao configurou.
  return NextResponse.json(mapa, { headers: { "Cache-Control": "no-store" } })
}

export async function PUT(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const dados: Record<string, string> = await request.json()

  for (const chave of CHAVES) {
    // So sobrescreve se veio algo novo - campo vazio no formulario significa
    // "nao mexer", nunca apaga um segredo ja configurado por engano.
    if (dados[chave] !== undefined && dados[chave].trim() !== "") {
      await setSegredo(chave, dados[chave].trim())
    }
  }

  return NextResponse.json({ sucesso: true })
}
