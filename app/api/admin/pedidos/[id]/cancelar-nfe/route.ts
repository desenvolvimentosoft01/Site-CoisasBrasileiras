import { transacao } from "@/lib/db"
import { registrarMovimentoEstoque } from "@/lib/estoque-movimento"
import { exigirSessao } from "@/lib/auth-servidor"
import { cancelarNotaFiscalBling } from "@/lib/bling"
import { notificarClientesEstoqueVoltou } from "@/lib/notificar-estoque"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
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
      if (!pedido.bling_nota_id) throw new Error("Este pedido não tem NF-e emitida")
      if (pedido.bling_nota_cancelada_em) throw new Error("Esta NF-e já foi cancelada")

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
        const [produtoAtualizado] = await q(
          "UPDATE TAB_PRODUTO SET estoque = estoque + $1 WHERE id = $2 RETURNING estoque",
          [item.quantidade, item.produto_id]
        )
        await registrarMovimentoEstoque(q, {
          produtoId: item.produto_id,
          quantidade: Number(item.quantidade),
          tipo: "entrada",
          motivo: "cancelamento_venda",
          saldoApos: Number(produtoAtualizado?.estoque ?? 0),
          origemTipo: "pedido",
          origemId: id,
          observacao: "Estorno por cancelamento da NF-e",
        })
      }

      return { pedidoAtualizado: atualizado, produtosIds: itens.map((i) => i.produto_id) }
    })

    // Cancelamento de NF-e e irreversivel e mexe em estoque - a justificativa
    // entra na auditoria porque e ela que responde "por que cancelaram?" meses
    // depois, quando ninguem mais lembra.
    await registrarAuditoriaServidor({
      sessao: sessaoOuErro,
      tela: "Pedidos",
      acao: "exclusao",
      tabela: "TAB_PEDIDO",
      registroId: id,
      depois: {
        evento: "NF-e cancelada",
        justificativa: justificativa || null,
        estoque_estornado: produtosIds.length,
      },
    })

    // Fora da transacao, de proposito - envio de email nao deve travar nem
    // fazer o cancelamento falhar se o SMTP tiver problema.
    for (const produtoId of produtosIds) {
      notificarClientesEstoqueVoltou(produtoId)
    }

    return NextResponse.json(pedidoAtualizado)
  } catch (erro) {
    if (erro instanceof Error && erro.message === "NOT_FOUND") {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 })
    }
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao cancelar NF-e no Bling" },
      { status: 400 }
    )
  }
}
