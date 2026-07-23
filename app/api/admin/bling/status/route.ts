import { exigirAdmin } from "@/lib/auth-servidor"
import { statusConexaoBling } from "@/lib/bling"
import { NextResponse } from "next/server"

// So devolve conectado/expiraEm - NUNCA os tokens (nem pro admin autenticado,
// nao ha motivo pra expor isso no client).
export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const status = await statusConexaoBling()
  return NextResponse.json(status)
}
