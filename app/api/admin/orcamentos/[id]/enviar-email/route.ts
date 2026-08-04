import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { enviarEmail, templateOrcamentoEnviado } from "@/lib/email"
import { NextResponse } from "next/server"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [orcamento] = await query(
    `SELECT id, numero, titulo, cliente_nome, cliente_email, subtotal, desconto, total, token_aprovacao
     FROM TAB_ORCAMENTO WHERE id = $1`,
    [id]
  )
  if (!orcamento) {
    return NextResponse.json({ erro: "Orcamento nao encontrado" }, { status: 404 })
  }
  if (!orcamento.cliente_email) {
    return NextResponse.json({ erro: "Cliente sem e-mail cadastrado nesse orcamento" }, { status: 400 })
  }

  const itens = await query(
    `SELECT descricao, quantidade, valor_unitario FROM TAB_ORCAMENTO_ITEM WHERE orcamento_id = $1 ORDER BY id`,
    [id]
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const link = `${siteUrl}/orcamento/aprovar/${orcamento.token_aprovacao}?canal=email`

  await enviarEmail({
    to: orcamento.cliente_email,
    subject: `Orcamento OR.${String(orcamento.numero).padStart(4, "0")} - Coisas Brasileiras`,
    html: templateOrcamentoEnviado({
      nomeCliente: orcamento.cliente_nome,
      numero: orcamento.numero,
      titulo: orcamento.titulo,
      itens: itens.map((i) => ({ nome: i.descricao, quantidade: Number(i.quantidade), precoUnitario: Number(i.valor_unitario) })),
      subtotal: Number(orcamento.subtotal),
      desconto: Number(orcamento.desconto),
      total: Number(orcamento.total),
      link,
    }),
  })

  await query("UPDATE TAB_ORCAMENTO SET enviado_email_em = NOW() WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
