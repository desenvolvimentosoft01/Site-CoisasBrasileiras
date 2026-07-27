import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { cancelarAssinaturaClube } from "@/lib/clube"
import { NextResponse } from "next/server"

export async function POST() {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  try {
    await cancelarAssinaturaClube(sessaoOuErro.id)
    return NextResponse.json({ sucesso: true })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao cancelar assinatura" },
      { status: 400 }
    )
  }
}
