import { query } from "@/lib/db"
import { exigirSessaoCliente } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import crypto from "crypto"

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

// Direito de eliminacao da LGPD (art. 18, VI). Sem pedido nenhum, o cadastro
// e apagado de verdade. Com pedido vinculado, nao da pra apagar a linha (o
// historico fiscal/de vendas precisa continuar integro), entao anonimizamos
// os dados de identificacao e desativamos o login - o pedido em si permanece
// intacto pro registro contabil exigido por lei.
export async function DELETE() {
  const sessaoOuErro = await exigirSessaoCliente()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const temPedido = await query("SELECT id FROM TAB_PEDIDO WHERE cliente_id = $1 LIMIT 1", [sessaoOuErro.id])

  if (temPedido.length === 0) {
    await query("DELETE FROM TAB_CLIENTE WHERE id = $1", [sessaoOuErro.id])
  } else {
    const emailAnonimizado = `removido-${sessaoOuErro.id}@removido.local`
    const senhaInutilizavel = crypto.randomBytes(32).toString("hex")
    await query(
      `UPDATE TAB_CLIENTE
       SET nome = 'Cliente removido', email = $1, telefone = NULL, cpf_cnpj = NULL, senha_hash = $2, ativo = false
       WHERE id = $3`,
      [emailAnonimizado, senhaInutilizavel, sessaoOuErro.id]
    )
  }

  const response = NextResponse.json({ sucesso: true })
  response.cookies.set("cliente_sessao", "", { maxAge: 0, path: "/" })
  return response
}
