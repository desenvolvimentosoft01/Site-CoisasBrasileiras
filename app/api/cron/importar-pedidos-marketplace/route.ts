import { statusConexaoBling } from "@/lib/bling"
import { importarPedidosMarketplace } from "@/lib/bling-marketplace"
import { NextResponse } from "next/server"

// Chamado por um agendador externo (Vercel Cron, ver vercel.json) - importa
// pedidos novos de Mercado Livre/Shopee que chegaram no Bling desde a ultima
// execucao. Mesmo esqueleto de app/api/cron/notas-bling-pendentes.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 })
    }
  }

  const status = await statusConexaoBling()
  if (!status.conectado) {
    return NextResponse.json({ importado: false, motivo: "Bling nao conectado" })
  }

  try {
    const resultado = await importarPedidosMarketplace()
    return NextResponse.json({ importado: true, ...resultado })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao importar pedidos do Bling" },
      { status: 500 }
    )
  }
}
