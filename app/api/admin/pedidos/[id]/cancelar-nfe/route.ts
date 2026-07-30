import { transacao } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { cancelarNotaFiscalBling } from "@/lib/bling"
import { notificarClientesEstoqueVoltou } from "@/lib/notificar-estoque"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { justificativa } = await request.json()

  try {
    // FOR UPDATE trava o pedido ate o fim da transacao (incluindo a chamada
    // ao Bling) - evita que dois cliques quase simultaneos passem os dois
    // pela checagem antes de qualquer um gravar o cancelamento.
    const { pedidoAtualizado, produtosIds } = await transacao(async (q) => {
      const [pedido] = await q(
        "SELECT bling_nota_id, bling_nota_cancelada_em FROM TAB_PEDIDO WHERE id = $1 FOR UPDATE",
        [id]
      )

      if (!pedido) throw new Error("NOT_FOUND")
      if (!pedido.bling_nota_id) throw new Error("Este pedido nao tem NF-e emitida")
      if (pedido.bling_nota_cancelada_em) throw new Error("Esta NF-e ja foi cancelada")

      await cancelarNotaFiscalBling(pedido.bling_nota_id, justificativa || "")

      const [atualizado] = await q(
        "UPDATE TAB_PEDIDO SET bling_nota_cancelada_em = NOW() WHERE id = $1 RETURNING bling_nota_cancelada_em",
        [id]
      )

      // Estorna o estoque baixado quando o pedido foi pago - mesmo padrao de
      // ERP: cancelar a nota de saida devolve a mercadoria ao estoque.
      const itens = await q(
        "SELECT produto_id, quantidade FROM TAB_PEDIDO_ITEM WHERE pedido_id = $1",
        [id]
      )
      for (const item of itens) {
        await q("UPDATE TAB_PRODUTO SET estoque = estoque + $1 WHERE id = $2", [
          item.quantidade,
          item.produto_id,
        ])
      }

      return { pedidoAtualizado: atualizado, produtosIds: itens.map((i) => i.produto_id) }
    })

    // Fora da transacao, de proposito - envio de email nao deve travar nem
    // fazer o cancelamento falhar se o SMTP tiver problema.
    for (const produtoId of produtosIds) {
      notificarClientesEstoqueVoltou(produtoId)
    }

    return NextResponse.json(pedidoAtualizado)
  } catch (erro) {
    if (erro instanceof Error && erro.message === "NOT_FOUND") {
      return NextResponse.json({ erro: "Pedido nao encontrado" }, { status: 404 })
    }
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao cancelar NF-e no Bling" },
      { status: 400 }
    )
  }
}
