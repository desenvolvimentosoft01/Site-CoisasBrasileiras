import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { getConfiguracoesMarca, salvarConfiguracoesMarca, type Marca } from "@/lib/configuracoes"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// So esses campos de identidade/vitrine continuam por marca (colorido/branco)
// em TAB_CONFIGURACAO_MARCA - nome, logo, banner e "sobre nos" fazem sentido
// diferentes pra cada loja. Contato (whatsapp, instagram, email, endereco) e
// o resto (frete, custos, integracoes) sao compartilhados em TAB_CONFIGURACAO.
const CHAVES_MARCA = ["nome_loja", "logo_url", "banner_texto_topo", "texto_sobre_nos"]

export async function GET(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const marcaParam = new URL(request.url).searchParams.get("marca")
  const marca: Marca = marcaParam === "branco" ? "branco" : "colorido"

  const linhas = await query("SELECT chave, valor FROM TAB_CONFIGURACAO")
  const mapa: Record<string, string> = {}
  for (const linha of linhas) {
    mapa[linha.chave] = linha.valor ?? ""
  }

  const mapaMarca = await getConfiguracoesMarca(CHAVES_MARCA, marca)
  for (const chave of CHAVES_MARCA) {
    mapa[chave] = mapaMarca[chave] ?? ""
  }

  return NextResponse.json(mapa)
}

export async function PUT(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const marcaParam = new URL(request.url).searchParams.get("marca")
  const marca: Marca = marcaParam === "branco" ? "branco" : "colorido"

  const configuracoes: Record<string, string> = await request.json()
  const configuracoesMarca = Object.fromEntries(
    Object.entries(configuracoes).filter(([chave]) => CHAVES_MARCA.includes(chave))
  )
  const configuracoesGlobais = Object.fromEntries(
    Object.entries(configuracoes).filter(([chave]) => !CHAVES_MARCA.includes(chave))
  )

  for (const [chave, valor] of Object.entries(configuracoesGlobais)) {
    await query(
      `INSERT INTO TAB_CONFIGURACAO (chave, valor, atualizado_em)
       VALUES ($1, $2, NOW())
       ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
      [chave, valor]
    )
  }

  await salvarConfiguracoesMarca(configuracoesMarca, marca)

  // O site publico (home, catalogo, produto) e pre-renderizado estaticamente
  // no build por nao usar cookies/headers - sem isso, uma config salva aqui
  // (whatsapp, instagram, cor, textos) so apareceria no proximo deploy.
  revalidatePath("/", "layout")

  return NextResponse.json({ sucesso: true })
}
