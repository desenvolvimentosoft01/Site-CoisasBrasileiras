import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const linhas = await query("SELECT chave, valor FROM TAB_CONFIGURACAO")
  const mapa: Record<string, string> = {}
  for (const linha of linhas) {
    mapa[linha.chave] = linha.valor ?? ""
  }

  return NextResponse.json(mapa)
}

export async function PUT(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const configuracoes: Record<string, string> = await request.json()

  for (const [chave, valor] of Object.entries(configuracoes)) {
    await query(
      `INSERT INTO TAB_CONFIGURACAO (chave, valor, atualizado_em)
       VALUES ($1, $2, NOW())
       ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
      [chave, valor]
    )
  }

  // O site publico (home, catalogo, produto) e pre-renderizado estaticamente
  // no build por nao usar cookies/headers - sem isso, uma config salva aqui
  // (whatsapp, instagram, cor, textos) so apareceria no proximo deploy.
  revalidatePath("/", "layout")

  return NextResponse.json({ sucesso: true })
}
