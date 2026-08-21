// Sem fallback de proposito: um segredo padrao conhecido (mesmo que so pra
// "dev") ficaria commitado no codigo publico do projeto, e qualquer deploy
// que esquecesse de configurar AUTH_SECRET assinaria sessoes de admin com um
// valor que qualquer um poderia forjar. Falhar alto (nao subir sem a
// variavel) e mais seguro que falhar silencioso com um segredo previsivel.
const SEGREDO = process.env.AUTH_SECRET
if (!SEGREDO) {
  throw new Error(
    "AUTH_SECRET nao configurado - defina essa variavel de ambiente antes de rodar o site (gere um valor aleatorio, ex: openssl rand -hex 32)"
  )
}

export type SessaoAdmin = {
  id: string
  nome: string
  email: string
  papel: string
  // Senha definida por outra pessoa (cadastro novo ou reset pelo admin). Vai
  // no token pra que o middleware consiga barrar as telas sem precisar
  // consultar o banco a cada navegacao.
  senhaProvisoria?: boolean
}

export { EMAIL_DESENVOLVEDOR } from "@/lib/constantes"

export type SessaoCliente = {
  id: string
  nome: string
  email: string
}

// Usa Web Crypto (SubtleCrypto) em vez do modulo `crypto` do Node porque este
// arquivo tambem roda no middleware, que usa o Edge Runtime.
async function assinar(payload: string): Promise<string> {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SEGREDO),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(payload))
  return Buffer.from(assinatura).toString("hex")
}

// Gera o valor do cookie: payload em base64 + assinatura, para evitar que o
// cliente forje uma sessao alterando o id/papel manualmente.
async function criarToken<T>(sessao: T): Promise<string> {
  const payload = Buffer.from(JSON.stringify(sessao)).toString("base64url")
  const assinatura = await assinar(payload)
  return `${payload}.${assinatura}`
}

async function lerToken<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null

  const [payload, assinatura] = token.split(".")
  if (!payload || !assinatura) return null

  const assinaturaEsperada = await assinar(payload)
  if (assinatura !== assinaturaEsperada) return null

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"))
  } catch {
    return null
  }
}

export const criarTokenSessao = (sessao: SessaoAdmin) => criarToken(sessao)
export const lerTokenSessao = (token: string | undefined) => lerToken<SessaoAdmin>(token)

export const criarTokenSessaoCliente = (sessao: SessaoCliente) => criarToken(sessao)
export const lerTokenSessaoCliente = (token: string | undefined) => lerToken<SessaoCliente>(token)
