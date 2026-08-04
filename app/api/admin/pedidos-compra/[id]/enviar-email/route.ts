import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { enviarEmail, templatePedidoCompraEnviado } from "@/lib/email"
import { NextResponse } from "next/server"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [pedido] = await query(
    `SELECT pc.id, pc.numero, pc.observacao, pc.valor_total, pc.status,
       f.razao_social AS fornecedor_nome, f.email AS fornecedor_email
     FROM TAB_PEDIDO_COMPRA pc
     JOIN TAB_FORNECEDOR f ON f.id = pc.fornecedor_id
     WHERE pc.id = $1`,
    [id]
  )
  if (!pedido) {
    return NextResponse.json({ erro: "Pedido de compra não encontrado" }, { status: 404 })
  }
  if (!pedido.fornecedor_email) {
    return NextResponse.json({ erro: "Fornecedor sem e-mail cadastrado" }, { status: 400 })
  }

  const itens = await query(
    `SELECT descricao, quantidade, custo_unitario FROM TAB_PEDIDO_COMPRA_ITEM WHERE pedido_compra_id = $1 ORDER BY id`,
    [id]
  )

  await enviarEmail({
    to: pedido.fornecedor_email,
    subject: `Pedido de compra PC.${String(pedido.numero).padStart(4, "0")} - Coisas Brasileiras`,
    html: templatePedidoCompraEnviado({
      nomeFornecedor: pedido.fornecedor_nome,
      numero: pedido.numero,
      itens: itens.map((i) => ({
        nome: i.descricao,
        quantidade: Number(i.quantidade),
        precoUnitario: Number(i.custo_unitario),
      })),
      total: Number(pedido.valor_total),
      observacao: pedido.observacao,
    }),
  })

  await query(
    `UPDATE TAB_PEDIDO_COMPRA SET enviado_email_em = NOW(), status = CASE WHEN status = 'aberto' THEN 'enviado' ELSE status END, atualizado_em = NOW()
     WHERE id = $1`,
    [id]
  )

  return NextResponse.json({ sucesso: true })
}
