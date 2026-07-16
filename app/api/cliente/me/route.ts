import { lerTokenSessaoCliente } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessaoCliente(cookieStore.get("cliente_sessao")?.value)

  if (!sessao) {
    return NextResponse.json({ erro: "Nao autenticado" }, { status: 401 })
  }

  return NextResponse.json(sessao)
}
