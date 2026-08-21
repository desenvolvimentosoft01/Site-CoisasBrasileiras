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
  // Instante (epoch ms) em que a sessao deixa de valer. Quem carimba e o
  // criarTokenSessao - nenhum chamador precisa informar.
  expira?: number
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

// Teto de vida da sessao, contado do login. Quem encerra a sessao no dia a dia
// e o fechamento do navegador (o cookie nao tem maxAge - ver
// OPCOES_COOKIE_SESSAO_ADMIN), mas computador de loja passa dias com a janela
// aberta: sem prazo dentro do proprio token, quem entrou uma vez nunca mais
// digitaria a senha.
//
// Sete dias e o MESMO prazo que o maxAge do cookie ja aplicava antes - a
// mudanca foi no gatilho (fechar o navegador), nao na duracao, pra nao derrubar
// no meio do expediente quem so queria voltar a cair na tela de entrada.
const VALIDADE_SESSAO_ADMIN_MS = 7 * 24 * 60 * 60 * 1000

export const criarTokenSessao = (sessao: SessaoAdmin) =>
  criarToken<SessaoAdmin>({ ...sessao, expira: Date.now() + VALIDADE_SESSAO_ADMIN_MS })

export async function lerTokenSessao(token: string | undefined): Promise<SessaoAdmin | null> {
  const sessao = await lerToken<SessaoAdmin>(token)
  if (!sessao) return null

  // Token sem prazo foi emitido antes desta regra existir, quando quem
  // controlava o vencimento era so o maxAge do cookie. Vale como vencido: e o
  // que garante que nenhuma sessao gravada em disco sobreviva ao deploy - do
  // contrario o primeiro objetivo da mudanca (abrir sempre no login) so
  // valeria pra quem entrasse de novo.
  if (!sessao.expira || sessao.expira <= Date.now()) return null

  return sessao
}

// Opcoes do cookie do painel, num lugar so: a rota de login e a de troca de
// senha emitem o mesmo cookie, e duas listas iguais escritas em dois arquivos
// acabam discordando na primeira vez que uma delas muda.
//
// Sem `maxAge` de proposito - e isso que faz dele um cookie de SESSAO, apagado
// pelo navegador ao fechar a janela. Antes eram 7 dias gravados em disco, e
// reabrir o navegador (ou religar o computador) caia direto no painel; agora
// cada abertura do sistema passa pela tela de entrada. Usuario e senha
// continuam sendo lembrados pelo gerenciador do navegador, que e outra coisa e
// nao depende deste cookie.
export const OPCOES_COOKIE_SESSAO_ADMIN = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const

export const criarTokenSessaoCliente = (sessao: SessaoCliente) => criarToken(sessao)
export const lerTokenSessaoCliente = (token: string | undefined) => lerToken<SessaoCliente>(token)
