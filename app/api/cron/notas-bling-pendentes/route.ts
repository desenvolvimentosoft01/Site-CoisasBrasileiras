import { query } from "@/lib/db"
import { listarNotasEntradaBling, statusConexaoBling } from "@/lib/bling"
import { getSegredo } from "@/lib/segredos"
import { enviarEmail, templateNotasBlingPendentes } from "@/lib/email"
import { NextResponse } from "next/server"

// SITUACAO_CANCELADA: 2 Cancelada, 4 Rejeitada, 9 Denegada, 11 Bloqueada -
// nao ha o que lancar nesses casos (mesma lista de app/api/admin/bling/notas-entrada).
const SITUACOES_SEM_LANCAMENTO = [2, 4, 9, 11]

// Chamado por um agendador externo (Vercel Cron, ver vercel.json) - avisa o
// admin por e-mail quando aparece nota de entrada nova (fornecedor) esperando
// ser lancada em Compras, sem precisar entrar no painel "Notas do Bling" pra
// descobrir sozinho. So notifica cada nota uma vez (TAB_BLING_NOTA_NOTIFICADA).
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
    }
  }

  const status = await statusConexaoBling()
  if (!status.conectado) {
    return NextResponse.json({ verificado: false, motivo: "Bling nao conectado" })
  }

  try {
    // Ultimos 30 dias - nao tem por que notificar de novo sobre nota antiga
    // que ficou pendente ha meses (o admin ja deve ter visto).
    const inicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const notas = await listarNotasEntradaBling({ dataEmissaoInicial: inicio })

    const jaLancadas = await query(
      "SELECT bling_nota_id FROM TAB_COMPRA WHERE bling_nota_id = ANY($1)",
      [notas.map((n) => n.id)]
    )
    const idsLancados = new Set(jaLancadas.map((c) => c.bling_nota_id))

    const jaNotificadas = await query(
      "SELECT bling_nota_id FROM TAB_BLING_NOTA_NOTIFICADA WHERE bling_nota_id = ANY($1)",
      [notas.map((n) => n.id)]
    )
    const idsNotificados = new Set(jaNotificadas.map((n) => n.bling_nota_id))

    // Total pendente agora (pra badge no menu) - diferente de "novas", que so
    // conta as que ainda nunca geraram e-mail.
    const totalPendentes = notas.filter(
      (nota) => !idsLancados.has(nota.id) && !SITUACOES_SEM_LANCAMENTO.includes(nota.situacao)
    ).length
    await query("UPDATE TAB_INTEGRACAO_BLING SET notas_pendentes = $1", [totalPendentes])

    const pendentesNovas = notas.filter(
      (nota) =>
        !idsLancados.has(nota.id) &&
        !idsNotificados.has(nota.id) &&
        !SITUACOES_SEM_LANCAMENTO.includes(nota.situacao)
    )

    if (pendentesNovas.length === 0) {
      return NextResponse.json({ verificado: true, novas: 0, totalPendentes })
    }

    const emailAdmin = (await getSegredo("email_notificacoes_admin")) || (await getSegredo("email_user"))
    if (emailAdmin) {
      await enviarEmail({
        to: emailAdmin,
        subject: `${pendentesNovas.length} nota(s) de fornecedor pendente(s) no Bling`,
        html: templateNotasBlingPendentes(pendentesNovas),
      })
    }

    for (const nota of pendentesNovas) {
      await query(
        "INSERT INTO TAB_BLING_NOTA_NOTIFICADA (bling_nota_id) VALUES ($1) ON CONFLICT DO NOTHING",
        [nota.id]
      )
    }

    return NextResponse.json({ verificado: true, novas: pendentesNovas.length, totalPendentes })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao verificar notas no Bling" },
      { status: 500 }
    )
  }
}
