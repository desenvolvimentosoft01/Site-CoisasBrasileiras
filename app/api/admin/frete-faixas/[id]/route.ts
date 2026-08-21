import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { valor, prazoDias } = await request.json()

  // Valor anterior lido antes do UPDATE - e o que responde "quem mudou o
  // frete e de quanto pra quanto?" quando o cliente reclama do preco.
  const [antes] = await query(
    "SELECT regiao, peso_min_kg, peso_max_kg, valor, prazo_dias FROM TAB_FRETE_FAIXA WHERE id = $1",
    [id]
  )

  if (!valor || Number(valor) <= 0) {
    return NextResponse.json({ erro: "Valor é obrigatório" }, { status: 400 })
  }

  const [faixa] = await query(
    `UPDATE TAB_FRETE_FAIXA SET valor = $1, prazo_dias = $2
     WHERE id = $3
     RETURNING id, regiao, peso_min_kg, peso_max_kg, valor, prazo_dias`,
    [valor, prazoDias || 7, id]
  )

  if (!faixa) {
    return NextResponse.json({ erro: "Faixa não encontrada" }, { status: 404 })
  }

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Frete por faixa",
    acao: "edicao",
    tabela: "TAB_FRETE_FAIXA",
    registroId: id,
    antes: antes ?? null,
    depois: { valor: faixa.valor, prazo_dias: faixa.prazo_dias },
  })

  return NextResponse.json(faixa)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const [excluida] = await query(
    "DELETE FROM TAB_FRETE_FAIXA WHERE id = $1 RETURNING regiao, peso_min_kg, peso_max_kg, valor, prazo_dias",
    [id]
  )

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Frete por faixa",
    acao: "exclusao",
    tabela: "TAB_FRETE_FAIXA",
    registroId: id,
    antes: excluida ?? null,
  })

  return NextResponse.json({ sucesso: true })
}
