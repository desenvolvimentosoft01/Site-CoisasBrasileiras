import { validarCupom } from "@/lib/cupom"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { codigo, subtotal } = await request.json()

  if (!codigo) {
    return NextResponse.json({ erro: "Informe o codigo do cupom" }, { status: 400 })
  }

  const resultado = await validarCupom(codigo, sessaoOuErro.id, Number(subtotal) || 0)

  if (!resultado.valido) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 })
  }

  return NextResponse.json({ desconto: resultado.desconto })
}
