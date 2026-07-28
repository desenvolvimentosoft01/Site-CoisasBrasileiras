import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// So permite editar dados cadastrais - email e senha sao credenciais de
// login do cliente no site, o admin nao deve alterar por aqui.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, telefone, cpf_cnpj, ativo } = await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome e obrigatorio" }, { status: 400 })
  }

  const [cliente] = await query(
    `UPDATE TAB_CLIENTE SET nome = $1, telefone = $2, cpf_cnpj = $3, ativo = $4
     WHERE id = $5
     RETURNING id, nome, email, telefone, cpf_cnpj, ativo, criado_em`,
    [nome.trim(), telefone || null, cpf_cnpj || null, ativo ?? true, id]
  )

  if (!cliente) {
    return NextResponse.json({ erro: "Cliente nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(cliente)
}

// So exclui de fato quando o cliente nunca teve nenhum pedido (cadastro
// duplicado/erro de digitacao, por exemplo). Se ja tiver pedido vinculado,
// o registro precisa ficar no banco pro historico de vendas continuar
// integro - nesse caso a unica acao permitida e inativar (PUT com ativo=false).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  try {
    await query("DELETE FROM TAB_CLIENTE WHERE id = $1", [id])
  } catch (erro) {
    if (erro instanceof Error && "code" in erro && erro.code === "23503") {
      return NextResponse.json(
        { erro: "Este cliente ja tem pedidos vinculados e nao pode ser excluido. Inative-o em vez disso." },
        { status: 409 }
      )
    }
    throw erro
  }

  return NextResponse.json({ sucesso: true })
}
