import { exigirSessao } from "@/lib/auth-servidor"
import { rastrearPedidoFrenet } from "@/lib/frenet"
import { NextResponse } from "next/server"

// So confirma se o codigo de rastreio existe de verdade (consulta a
// transportadora via Frenet) - acao manual, opcional, nunca bloqueia o
// salvamento do rastreio (esse endpoint nem existe se o admin nao pedir).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  await params // so pra manter a assinatura consistente com as outras rotas de pedido
  const { codigoRastreio, codigoServicoFrenet } = await request.json()

  if (!codigoRastreio || !codigoServicoFrenet) {
    return NextResponse.json(
      { erro: "Informe o codigo de rastreio e o codigo de servico da Frenet" },
      { status: 400 }
    )
  }

  try {
    const resultado = await rastrearPedidoFrenet({
      trackingNumber: codigoRastreio,
      shippingServiceCode: codigoServicoFrenet,
    })
    return NextResponse.json(resultado)
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao validar rastreio na Frenet" },
      { status: 400 }
    )
  }
}
