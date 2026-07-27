import { transacao } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  try {
    // FOR UPDATE trava a linha ate o commit - evita que "cancelar" e
    // "receber" disparados quase juntos leiam o mesmo status "pendente" e os
    // dois passem na checagem antes de qualquer um gravar.
    const compraCancelada = await transacao(async (q) => {
      const [compra] = await q("SELECT status FROM TAB_COMPRA WHERE id = $1 FOR UPDATE", [id])
      if (!compra) {
        throw new Error("NOT_FOUND")
      }
      if (compra.status !== "pendente") {
        throw new Error("So e possivel cancelar uma compra pendente (ainda nao recebida).")
      }

      const [atualizada] = await q(
        "UPDATE TAB_COMPRA SET status = 'cancelada', atualizado_em = NOW() WHERE id = $1 RETURNING id, status",
        [id]
      )
      return atualizada
    })

    return NextResponse.json(compraCancelada)
  } catch (erro) {
    if (erro instanceof Error && erro.message === "NOT_FOUND") {
      return NextResponse.json({ erro: "Compra nao encontrada" }, { status: 404 })
    }
    const mensagem = erro instanceof Error ? erro.message : "Erro ao cancelar compra"
    return NextResponse.json({ erro: mensagem }, { status: 409 })
  }
}
