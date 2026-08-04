import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { enviarEmail, templateOrcamentoEnviado } from "@/lib/email"
import { gerarPdfOrcamento } from "@/lib/pdf-orcamento"
import { getConfiguracoes } from "@/lib/configuracoes"
import { NextResponse } from "next/server"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [orcamento] = await query(
    `SELECT id, numero, titulo, cliente_nome, cliente_email, condicoes, subtotal, desconto, total,
       token_aprovacao, criado_em
     FROM TAB_ORCAMENTO WHERE id = $1`,
    [id]
  )
  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 })
  }
  if (!orcamento.cliente_email) {
    return NextResponse.json({ erro: "Cliente sem e-mail cadastrado nesse orçamento" }, { status: 400 })
  }

  const [itens, config] = await Promise.all([
    query(
      `SELECT id, descricao, quantidade, valor_unitario, subtotal
       FROM TAB_ORCAMENTO_ITEM WHERE orcamento_id = $1 ORDER BY id`,
      [id]
    ),
    getConfiguracoes(["nome_loja"]),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const link = `${siteUrl}/orcamento/aprovar/${orcamento.token_aprovacao}?canal=email`
  const numeroFormatado = `OR.${String(orcamento.numero).padStart(4, "0")}`

  const pdf = await gerarPdfOrcamento({
    nomeLoja: config.nome_loja || "Coisas Brasileiras",
    numero: orcamento.numero,
    titulo: orcamento.titulo,
    clienteNome: orcamento.cliente_nome,
    criadoEm: new Date(orcamento.criado_em),
    itens: itens.map((i) => ({
      id: i.id,
      descricao: i.descricao,
      quantidade: Number(i.quantidade),
      valor_unitario: Number(i.valor_unitario),
      subtotal: Number(i.subtotal),
    })),
    subtotal: Number(orcamento.subtotal),
    desconto: Number(orcamento.desconto),
    total: Number(orcamento.total),
    condicoes: orcamento.condicoes,
  })

  await enviarEmail({
    to: orcamento.cliente_email,
    subject: `Orcamento ${numeroFormatado} - Coisas Brasileiras`,
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
    attachments: [{ filename: `${numeroFormatado}.pdf`, content: pdf, contentType: "application/pdf" }],
  })

  await query("UPDATE TAB_ORCAMENTO SET enviado_email_em = NOW() WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
