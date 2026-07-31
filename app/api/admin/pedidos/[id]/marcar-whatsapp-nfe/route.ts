import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Marcacao manual - o sistema nao tem como confirmar que a mensagem chegou
// de verdade no WhatsApp do cliente (isso exigiria integrar com a API do
// WhatsApp Business). O admin clica "Enviar por WhatsApp" (abre o link),
// e esse endpoint so registra que ele confirmou o envio.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [pedido] = await query(
    `UPDATE TAB_PEDIDO SET nota_fiscal_whatsapp_enviada_em = NOW()
     WHERE id = $1
     RETURNING nota_fiscal_whatsapp_enviada_em`,
    [id]
  )

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(pedido)
}
