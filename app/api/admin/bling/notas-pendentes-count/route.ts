import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// So le do banco (atualizado pelo cron diario) - nunca chama o Bling direto
// aqui, pra esse badge no menu nao bater na API deles toda vez que alguem
// abre o admin.
export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const [conexao] = await query("SELECT notas_pendentes FROM TAB_INTEGRACAO_BLING LIMIT 1")
  return NextResponse.json({ notasPendentes: conexao?.notas_pendentes ?? 0 })
}
