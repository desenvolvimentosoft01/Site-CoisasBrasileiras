import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const clientes = await query(
    "SELECT id, nome, email, telefone, cpf_cnpj, criado_em FROM TAB_CLIENTE ORDER BY nome"
  )
  return NextResponse.json(clientes)
}
