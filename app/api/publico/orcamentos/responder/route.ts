import { query } from "@/lib/db"
import { enviarEmail, templateOrcamentoRespondido } from "@/lib/email"
import { getSegredo } from "@/lib/segredos"
import { NextResponse } from "next/server"

// Rota publica (sem sessao) - o cliente responde ao orcamento pelo link
// recebido por WhatsApp ou e-mail. A protecao e o token (UUID nao-sequencial
// na URL), nao autenticacao.
export async function POST(request: Request) {
  const { token, decisao, canal, observacao } = (await request.json()) as {
    token?: string
    decisao?: "aprovado" | "recusado"
    canal?: "email" | "whatsapp"
    observacao?: string
  }

  if (!token || (decisao !== "aprovado" && decisao !== "recusado")) {
    return NextResponse.json({ erro: "Parametros invalidos" }, { status: 400 })
  }

  // So responde se ainda estiver "aberto" - impede que um segundo clique (ou
  // o link reaberto depois) sobrescreva uma resposta ja dada.
  const [orcamento] = await query(
    `UPDATE TAB_ORCAMENTO
     SET status = $1, canal_resposta = $2, respondido_em = NOW(),
         observacao_cliente = $3, atualizado_em = NOW()
     WHERE token_aprovacao = $4 AND status = 'aberto'
     RETURNING id, numero, titulo, cliente_nome`,
    [decisao, canal === "whatsapp" ? "whatsapp" : "email", decisao === "recusado" ? observacao?.trim() || null : null, token]
  )

  if (!orcamento) {
    return NextResponse.json({ erro: "Orcamento nao encontrado ou ja respondido" }, { status: 409 })
  }

  const emailAdmin = (await getSegredo("email_notificacoes_admin")) || (await getSegredo("email_user"))
  if (emailAdmin) {
    await enviarEmail({
      to: emailAdmin,
      subject: `Orcamento OR.${String(orcamento.numero).padStart(4, "0")} ${decisao === "aprovado" ? "aprovado" : "recusado"} - ${orcamento.cliente_nome}`,
      html: templateOrcamentoRespondido({
        numero: orcamento.numero,
        titulo: orcamento.titulo,
        clienteNome: orcamento.cliente_nome,
        aprovado: decisao === "aprovado",
        canal: canal === "whatsapp" ? "whatsapp" : "email",
        observacao: decisao === "recusado" ? observacao?.trim() || null : null,
      }),
    })
  }

  return NextResponse.json({ sucesso: true })
}
