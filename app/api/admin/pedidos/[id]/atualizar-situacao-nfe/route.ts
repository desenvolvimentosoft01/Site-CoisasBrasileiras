import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { consultarSituacaoNotaFiscalBling } from "@/lib/bling"
import { NextResponse } from "next/server"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [pedido] = await query("SELECT bling_nota_id FROM TAB_PEDIDO WHERE id = $1", [id])
  if (!pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 })
  }
  if (!pedido.bling_nota_id) {
    return NextResponse.json({ erro: "Esse pedido não tem nota fiscal emitida no Bling" }, { status: 400 })
  }

  let situacao: number
  try {
    situacao = await consultarSituacaoNotaFiscalBling(pedido.bling_nota_id)
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao consultar situação no Bling" },
      { status: 400 }
    )
  }

  await query(
    "UPDATE TAB_PEDIDO SET bling_nota_situacao = $1, bling_nota_situacao_atualizada_em = NOW() WHERE id = $2",
    [situacao, id]
  )

  return NextResponse.json({ situacao })
}
