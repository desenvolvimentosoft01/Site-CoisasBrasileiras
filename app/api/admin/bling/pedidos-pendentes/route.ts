import { exigirSessao } from "@/lib/auth-servidor"
import { descartarPedidoPendenteMarketplace, listarPedidosPendentesMarketplace } from "@/lib/bling-marketplace"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const pendentes = await listarPedidosPendentesMarketplace()
  return NextResponse.json(pendentes)
}

export async function DELETE(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id }: { id: string } = await request.json()
  if (!id) {
    return NextResponse.json({ erro: "id é obrigatório" }, { status: 400 })
  }

  await descartarPedidoPendenteMarketplace(id)
  return NextResponse.json({ sucesso: true })
}
