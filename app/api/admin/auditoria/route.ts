import { query } from "@/lib/db"
import { exigirSessao, exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Qualquer usuario logado do admin pode gerar auditoria (a acao e dele
// mesmo), mas so admin pode consultar o historico (GET).
export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const payload = await request.json()

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null

  await query(
    `INSERT INTO TAB_AUDITORIA
       (usuario_id, usuario_nome, tela, acao, tabela, registro_id, dados_antes, dados_depois, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      sessaoOuErro.id,
      sessaoOuErro.nome,
      payload.tela,
      payload.acao,
      payload.tabela,
      payload.registro_id ?? null,
      payload.dados_antes ?? null,
      payload.dados_depois ?? null,
      ip,
      request.headers.get("user-agent"),
    ]
  )

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const registros = await query(
    `SELECT id, usuario_nome, tela, acao, tabela, registro_id, dados_antes, dados_depois, criado_em
     FROM TAB_AUDITORIA
     ORDER BY criado_em DESC
     LIMIT 500`
  )
  return NextResponse.json(registros)
}
