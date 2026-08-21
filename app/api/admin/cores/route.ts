import { query } from "@/lib/db"
import { exigirDesenvolvedor } from "@/lib/auth-servidor"
import { getConfiguracoesMarca, salvarConfiguracoesMarca } from "@/lib/configuracoes"
import { CHAVES_COR_TEMA, CHAVES_COR_SISTEMA } from "@/lib/cores"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// Sem "marca" na URL: mantem o comportamento de sempre, editando o tema
// compartilhado (TAB_CONFIGURACAO) que tambem pinta o proprio painel admin.
// Com "?marca=branco": edita so a paleta do site Porcelanas Brancas
// (TAB_CONFIGURACAO_MARCA), sem repintar o admin.
export async function GET(request: Request) {
  const sessaoOuErro = await exigirDesenvolvedor()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const marca = new URL(request.url).searchParams.get("marca")

  if (marca === "branco") {
    const mapa = await getConfiguracoesMarca(CHAVES_COR_TEMA, "branco")
    return NextResponse.json(mapa)
  }

  const linhas = await query(
    "SELECT chave, valor FROM TAB_CONFIGURACAO WHERE chave = ANY($1)",
    // "sistema" e a paleta do painel (chaves cor_sistema_*), separada da do
    // site desde 2026-08-20: o painel e ferramenta de trabalho e e o mesmo
    // pras duas lojas, entao nao herda mais a cara da vitrine.
    [marca === "sistema" ? CHAVES_COR_SISTEMA : CHAVES_COR_TEMA]
  )
  const mapa: Record<string, string> = {}
  for (const linha of linhas) {
    mapa[linha.chave] = linha.valor ?? ""
  }

  return NextResponse.json(mapa)
}

export async function PUT(request: Request) {
  const sessaoOuErro = await exigirDesenvolvedor()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const marca = new URL(request.url).searchParams.get("marca")
  const cores: Record<string, string> = await request.json()
  // A lista de chaves aceitas muda com a paleta - sem isso, salvar o sistema
  // descartaria tudo, porque nenhuma chave cor_sistema_* esta em CHAVES_COR_TEMA.
  const chavesAceitas = marca === "sistema" ? CHAVES_COR_SISTEMA : CHAVES_COR_TEMA
  const coresValidas = Object.fromEntries(
    Object.entries(cores).filter(([chave]) => chavesAceitas.includes(chave))
  )

  if (marca === "branco") {
    await salvarConfiguracoesMarca(coresValidas, "branco")
    revalidatePath("/", "layout")
    return NextResponse.json({ sucesso: true })
  }

  for (const [chave, valor] of Object.entries(coresValidas)) {
    await query(
      `INSERT INTO TAB_CONFIGURACAO (chave, valor, atualizado_em)
       VALUES ($1, $2, NOW())
       ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
      [chave, valor]
    )
  }

  // Site publico e pre-renderizado (dynamic="force-dynamic" na loja ja cobre
  // isso, mas o admin tem paginas com cache proprio) - revalida os dois.
  revalidatePath("/", "layout")
  revalidatePath("/admin", "layout")

  return NextResponse.json({ sucesso: true })
}
