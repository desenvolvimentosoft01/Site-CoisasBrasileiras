import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { criarAssinaturaClube } from "@/lib/clube"
import { NextResponse } from "next/server"

export async function POST() {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  try {
    const initPoint = await criarAssinaturaClube({
      clienteId: sessaoOuErro.id,
      email: sessaoOuErro.email,
      siteUrl,
    })
    return NextResponse.json({ initPoint })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao criar assinatura" },
      { status: 400 }
    )
  }
}
