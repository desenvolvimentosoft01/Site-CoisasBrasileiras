import { statusConexaoBling } from "@/lib/bling"
import { importarPedidosMarketplace } from "@/lib/bling-marketplace"
import { segredoCronValido } from "@/lib/cron-auth"
import { NextResponse } from "next/server"

// Chamado pelo crontab da VPS (scripts/cron-vps.sh, ver DOCS/cron-vps.md) -
// importa pedidos novos de Mercado Livre/Shopee que chegaram no Bling desde
// a ultima execucao. Mesmo esqueleto de app/api/cron/notas-bling-pendentes.
export async function GET(request: Request) {
  if (!segredoCronValido(request)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
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
