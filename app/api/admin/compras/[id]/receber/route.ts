import { receberCompra } from "@/lib/compras"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  try {
    const compra = await receberCompra(id)
    return NextResponse.json(compra)
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao receber compra"
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }
}
