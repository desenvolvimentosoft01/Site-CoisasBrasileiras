import { query } from "@/lib/db"
import { exigirDesenvolvedor } from "@/lib/auth-servidor"
import { CHAVES_COR_TEMA } from "@/lib/cores"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET() {
  const sessaoOuErro = await exigirDesenvolvedor()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const linhas = await query(
    "SELECT chave, valor FROM TAB_CONFIGURACAO WHERE chave = ANY($1)",
    [CHAVES_COR_TEMA]
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

  const cores: Record<string, string> = await request.json()

  for (const [chave, valor] of Object.entries(cores)) {
    if (!CHAVES_COR_TEMA.includes(chave)) continue

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
