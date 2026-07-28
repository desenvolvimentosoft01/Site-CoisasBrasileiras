import { query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function DELETE(_request: Request, { params }: { params: Promise<{ produtoId: string }> }) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { produtoId } = await params
  await query("DELETE FROM TAB_LISTA_DESEJOS WHERE cliente_id = $1 AND produto_id = $2", [
    sessaoOuErro.id,
    produtoId,
  ])

  return NextResponse.json({ sucesso: true })
}
