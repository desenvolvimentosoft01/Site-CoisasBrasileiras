import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { assinaturaAtualDoCliente, valorMensalidadeClube } from "@/lib/clube"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const [assinatura, valorMensalidade] = await Promise.all([
    assinaturaAtualDoCliente(sessaoOuErro.id),
    valorMensalidadeClube(),
  ])

  return NextResponse.json({ assinatura, valorMensalidade })
}
