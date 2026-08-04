import { transacao, query } from "@/lib/db"
import { enviarEmail, templateCotacaoRespondida } from "@/lib/email"
import { getSegredo } from "@/lib/segredos"
import { NextResponse } from "next/server"

type RespostaItem = { itemId: string; quantidadeCotada: number; valorUnitarioCotado: number }

// Rota publica (sem sessao) - o fornecedor responde a cotacao pelo link
// recebido por e-mail/WhatsApp. Protecao e o token (UUID nao-sequencial na
// URL), nao autenticacao - mesmo padrao do /api/publico/orcamentos/responder.
export async function POST(request: Request) {
  const { token, itens, desconto } = (await request.json()) as {
    token?: string
    itens?: RespostaItem[]
    desconto?: number
  }

  if (!token || !Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }
  for (const item of itens) {
    if (!item.itemId || item.quantidadeCotada < 0 || item.valorUnitarioCotado < 0) {
      return NextResponse.json({ erro: "Confira as quantidades e preços informados" }, { status: 400 })
    }
  }

  const [cotacao] = await query(
    `SELECT id, numero, status, fornecedor_id FROM TAB_COTACAO WHERE token_resposta = $1`,
    [token]
  )
  if (!cotacao) {
    return NextResponse.json({ erro: "Cotação não encontrada" }, { status: 404 })
  }
  if (cotacao.status !== "enviado") {
    return NextResponse.json({ erro: "Essa cotação não está mais aguardando resposta" }, { status: 409 })
  }

  const [fornecedor] = await query("SELECT razao_social FROM TAB_FORNECEDOR WHERE id = $1", [cotacao.fornecedor_id])

  const valorDesconto = Math.max(0, Number(desconto) || 0)

  const itensAtualizados = await transacao(async (executar) => {
    for (const item of itens) {
      await executar(
        `UPDATE TAB_COTACAO_ITEM SET quantidade_cotada = $1, valor_unitario_cotado = $2
         WHERE id = $3 AND cotacao_id = $4`,
        [item.quantidadeCotada, item.valorUnitarioCotado, item.itemId, cotacao.id]
      )
    }
    await executar(
      `UPDATE TAB_COTACAO
       SET status = 'respondida', desconto = $1, respondido_em = NOW(), atualizado_em = NOW()
       WHERE id = $2`,
      [valorDesconto, cotacao.id]
    )
    return executar(
      `SELECT descricao, quantidade_solicitada, quantidade_cotada, valor_unitario_cotado
       FROM TAB_COTACAO_ITEM WHERE cotacao_id = $1 ORDER BY id`,
      [cotacao.id]
    )
  })

  const emailAdmin = (await getSegredo("email_notificacoes_admin")) || (await getSegredo("email_user"))
  if (emailAdmin) {
    const subtotal = itensAtualizados.reduce(
      (soma, i) => soma + Number(i.quantidade_cotada) * Number(i.valor_unitario_cotado),
      0
    )
    const total = Math.max(0, subtotal - valorDesconto)
    await enviarEmail({
      to: emailAdmin,
      subject: `Cotacao CT.${String(cotacao.numero).padStart(4, "0")} respondida - ${fornecedor?.razao_social ?? ""}`,
      html: templateCotacaoRespondida({
        numero: cotacao.numero,
        fornecedorNome: fornecedor?.razao_social ?? "",
        desconto: valorDesconto,
        itens: itensAtualizados.map((i) => ({
          descricao: i.descricao,
          quantidadeSolicitada: Number(i.quantidade_solicitada),
          quantidadeCotada: Number(i.quantidade_cotada),
          valorUnitarioCotado: Number(i.valor_unitario_cotado),
        })),
        total,
      }),
    })
  }

  return NextResponse.json({ sucesso: true })
}
