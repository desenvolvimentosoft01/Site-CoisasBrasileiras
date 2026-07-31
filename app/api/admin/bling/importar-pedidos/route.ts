import { exigirSessao } from "@/lib/auth-servidor"
import { importarPedidosMarketplace } from "@/lib/bling-marketplace"
import { NextResponse } from "next/server"

// Gatilho manual (botao "Importar agora" em /admin/pedidos) - roda a mesma
// funcao do cron sob demanda, sem esperar a proxima execucao agendada.
export async function POST() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  try {
    const resultado = await importarPedidosMarketplace()
    return NextResponse.json(resultado)
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao importar pedidos do Bling" },
      { status: 400 }
    )
  }
}
