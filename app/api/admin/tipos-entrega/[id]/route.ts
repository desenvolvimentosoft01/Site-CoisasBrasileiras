import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, ativo } = await request.json()

  // Lido antes: a auditoria de frete so ajuda se disser o valor anterior -
  // e a pergunta que aparece e "desde quando esta assim?".
  const [antes] = await query("SELECT nome, ativo FROM TAB_TIPO_ENTREGA WHERE id = $1", [id])

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 })
  }

  try {
    const [tipo] = await query(
      "UPDATE TAB_TIPO_ENTREGA SET nome = $1, ativo = $2 WHERE id = $3 RETURNING id, nome, ativo, criado_em",
      [nome.trim(), ativo ?? true, id]
    )
    if (!tipo) {
      return NextResponse.json({ erro: "Tipo de entrega não encontrado" }, { status: 404 })
    }
    await registrarAuditoriaServidor({
      sessao: sessaoOuErro,
      tela: "Tipos de entrega",
      acao: "edicao",
      tabela: "TAB_TIPO_ENTREGA",
      registroId: id,
      antes: antes ?? null,
      depois: { nome: tipo.nome, ativo: tipo.ativo },
    })

    return NextResponse.json(tipo)
  } catch (erro) {
    if (erro instanceof Error && "code" in erro && erro.code === "23505") {
      return NextResponse.json({ erro: "Já existe um tipo de entrega com esse nome" }, { status: 409 })
    }
    throw erro
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  // RETURNING guarda o que sumiu - exclusao nao tem "depois" pra consultar,
  // entao ou o registro entra na auditoria agora ou se perde de vez.
  const [excluido] = await query(
    "DELETE FROM TAB_TIPO_ENTREGA WHERE id = $1 RETURNING nome, ativo",
    [id]
  )

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Tipos de entrega",
    acao: "exclusao",
    tabela: "TAB_TIPO_ENTREGA",
    registroId: id,
    antes: excluido ?? null,
  })

  return NextResponse.json({ sucesso: true })
}
