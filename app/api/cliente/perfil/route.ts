import { query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const [cliente] = await query(
    "SELECT id, nome, email, telefone, cpf_cnpj FROM TAB_CLIENTE WHERE id = $1",
    [sessaoOuErro.id]
  )

  const enderecos = await query(
    "SELECT id, cep, logradouro, numero, complemento, bairro, cidade, estado, principal FROM TAB_ENDERECO WHERE cliente_id = $1 ORDER BY principal DESC",
    [sessaoOuErro.id]
  )

  return NextResponse.json({ ...cliente, enderecos })
}

export async function PUT(request: Request) {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome, telefone, cpfCnpj } = await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 })
  }

  const [cliente] = await query(
    "UPDATE TAB_CLIENTE SET nome = $1, telefone = $2, cpf_cnpj = $3 WHERE id = $4 RETURNING id, nome, email, telefone, cpf_cnpj",
    [nome.trim(), telefone || null, cpfCnpj || null, sessaoOuErro.id]
  )

  return NextResponse.json(cliente)
}
