import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Historico de movimentacao de um produto (kardex - migration 062). Responde a
// pergunta que o sistema nao sabia responder: "por que esse produto saiu de 40
// para 12?".
const LIMITE = 200

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  // Teto de 200 linhas: o historico de um produto girado cresce pra sempre, e
  // quem investiga divergencia olha o topo da lista. Se um dia precisar do
  // historico completo, isso vira paginacao - nao lista sem fim.
  const movimentos = await query(
    `SELECT m.id, m.quantidade, m.tipo, m.motivo, m.saldo_apos, m.origem_tipo, m.origem_id,
            m.observacao, m.criado_em, u.nome AS usuario_nome
     FROM TAB_ESTOQUE_MOVIMENTO m
     LEFT JOIN TAB_USUARIO_ADMIN u ON u.id = m.usuario_id
     WHERE m.produto_id = $1
     ORDER BY m.criado_em DESC
     LIMIT ${LIMITE}`,
    [id]
  )

  return NextResponse.json(movimentos)
}
