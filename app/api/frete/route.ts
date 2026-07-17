import { getConfiguracoes, calcularFrete } from "@/lib/configuracoes"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subtotal = Number(searchParams.get("subtotal")) || 0

  const config = await getConfiguracoes(["frete_valor_base", "frete_gratis_acima_de"])
  const valorFrete = await calcularFrete(subtotal)

  return NextResponse.json({
    valorFrete,
    freteGratisAcimaDe: Number(config.frete_gratis_acima_de) || 0,
  })
}
