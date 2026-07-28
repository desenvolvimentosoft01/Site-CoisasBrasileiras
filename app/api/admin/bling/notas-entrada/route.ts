import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { listarNotasEntradaBling } from "@/lib/bling"
import { NextResponse } from "next/server"

// SITUACAO_CANCELADA: 2 Cancelada, 4 Rejeitada, 9 Denegada, 11 Bloqueada -
// nao ha o que lancar nesses casos.
const SITUACOES_SEM_LANCAMENTO = [2, 4, 9, 11]

export async function GET(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { searchParams } = new URL(request.url)
  const dataEmissaoInicial = searchParams.get("inicio") || undefined
  const dataEmissaoFinal = searchParams.get("fim") || undefined

  try {
    const notas = await listarNotasEntradaBling({ dataEmissaoInicial, dataEmissaoFinal })

    const jaLancadas = await query(
      "SELECT bling_nota_id FROM TAB_COMPRA WHERE bling_nota_id = ANY($1)",
      [notas.map((n) => n.id)]
    )
    const idsLancados = new Set(jaLancadas.map((c) => c.bling_nota_id))

    const notasComStatus = notas.map((nota) => ({
      ...nota,
      statusLocal: idsLancados.has(nota.id)
        ? "lancada"
        : SITUACOES_SEM_LANCAMENTO.includes(nota.situacao)
          ? "cancelada"
          : "pendente",
    }))

    return NextResponse.json(notasComStatus)
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao consultar notas no Bling" },
      { status: 400 }
    )
  }
}
