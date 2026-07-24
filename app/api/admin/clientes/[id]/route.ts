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
