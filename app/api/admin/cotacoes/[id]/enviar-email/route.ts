import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { enviarEmail, templateCotacaoEnviada } from "@/lib/email"
import { NextResponse } from "next/server"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [cotacao] = await query(
    `SELECT ct.id, ct.numero, ct.observacao, ct.status, ct.token_resposta,
       f.razao_social AS fornecedor_nome, f.email AS fornecedor_email
     FROM TAB_COTACAO ct
     JOIN TAB_FORNECEDOR f ON f.id = ct.fornecedor_id
     WHERE ct.id = $1`,
    [id]
  )
  if (!cotacao) {
    return NextResponse.json({ erro: "Cotação não encontrada" }, { status: 404 })
  }
  if (cotacao.status === "aceita" || cotacao.status === "cancelada") {
    return NextResponse.json({ erro: "Essa cotação já foi encerrada" }, { status: 400 })
  }
  if (!cotacao.fornecedor_email) {
    return NextResponse.json({ erro: "Fornecedor sem e-mail cadastrado" }, { status: 400 })
  }

  const itens = await query(
    `SELECT descricao, quantidade_solicitada FROM TAB_COTACAO_ITEM WHERE cotacao_id = $1 ORDER BY id`,
    [id]
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const link = `${siteUrl}/cotacao/responder/${cotacao.token_resposta}`

  await enviarEmail({
    to: cotacao.fornecedor_email,
    subject: `Cotacao CT.${String(cotacao.numero).padStart(4, "0")} - Coisas Brasileiras`,
    html: templateCotacaoEnviada({
      nomeFornecedor: cotacao.fornecedor_nome,
      numero: cotacao.numero,
      itens: itens.map((i) => ({ descricao: i.descricao, quantidade: Number(i.quantidade_solicitada) })),
      observacao: cotacao.observacao,
      link,
    }),
  })

  await query(
    `UPDATE TAB_COTACAO
     SET enviado_email_em = NOW(), status = CASE WHEN status = 'aberto' THEN 'enviado' ELSE status END, atualizado_em = NOW()
     WHERE id = $1`,
    [id]
  )

  return NextResponse.json({ sucesso: true })
}
