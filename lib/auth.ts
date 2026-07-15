const SEGREDO = process.env.AUTH_SECRET || "[SEGREDO-REMOVIDO]"

export type SessaoAdmin = {
  id: string
  nome: string
  email: string
  papel: string
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
export async function criarTokenSessao(sessao: SessaoAdmin): Promise<string> {
  const payload = Buffer.from(JSON.stringify(sessao)).toString("base64url")
  const assinatura = await assinar(payload)
  return `${payload}.${assinatura}`
}

export async function lerTokenSessao(token: string | undefined): Promise<SessaoAdmin | null> {
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
