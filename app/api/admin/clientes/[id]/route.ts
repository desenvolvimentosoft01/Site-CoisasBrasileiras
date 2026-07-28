import { query, transacao } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Traz o cliente + o endereco principal (se tiver) pra tela de edicao do
// admin conseguir preencher o formulario completo.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [cliente] = await query(
    `SELECT c.id, c.nome, c.email, c.telefone, c.cpf_cnpj, c.ativo, c.criado_em,
       (c.senha_hash IS NOT NULL) AS veio_do_site,
       e.cep, e.logradouro, e.numero, e.complemento, e.bairro, e.cidade, e.estado
     FROM TAB_CLIENTE c
     LEFT JOIN TAB_ENDERECO e ON e.cliente_id = c.id AND e.principal = true
     WHERE c.id = $1`,
    [id]
  )

  if (!cliente) {
    return NextResponse.json({ erro: "Cliente nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(cliente)
}

// So permite editar dados cadastrais - email e senha sao credenciais de
// login do cliente no site, o admin nao deve alterar por aqui.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, telefone, cpf_cnpj, ativo, cep, logradouro, numero, complemento, bairro, cidade, estado } =
    await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome e obrigatorio" }, { status: 400 })
  }

  // Tudo numa transacao com FOR UPDATE no endereco: sem isso, dois cliques
  // rapidos em "Salvar" podem ambos nao encontrar o endereco principal e
  // ambos fazerem INSERT, criando dois enderecos "principal = true" pro
  // mesmo cliente.
  const cliente = await transacao(async (q) => {
    const [cliente] = await q(
      `UPDATE TAB_CLIENTE SET nome = $1, telefone = $2, cpf_cnpj = $3, ativo = $4
       WHERE id = $5
       RETURNING id, nome, email, telefone, cpf_cnpj, ativo, criado_em`,
      [nome.trim(), telefone || null, cpf_cnpj || null, ativo ?? true, id]
    )

    if (!cliente) return null

    // Endereco e opcional (nem todo cliente de balcao tem um) - so grava se
    // vier pelo menos o CEP e o logradouro preenchidos.
    if (cep && logradouro) {
      const [existente] = await q(
        "SELECT id FROM TAB_ENDERECO WHERE cliente_id = $1 AND principal = true FOR UPDATE",
        [id]
      )
      if (existente) {
        await q(
          `UPDATE TAB_ENDERECO SET cep = $1, logradouro = $2, numero = $3, complemento = $4, bairro = $5, cidade = $6, estado = $7
           WHERE id = $8`,
          [cep, logradouro, numero || "", complemento || null, bairro || "", cidade || "", estado || "", existente.id]
        )
      } else {
        await q(
          `INSERT INTO TAB_ENDERECO (cliente_id, cep, logradouro, numero, complemento, bairro, cidade, estado, principal)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
          [id, cep, logradouro, numero || "", complemento || null, bairro || "", cidade || "", estado || ""]
        )
      }
    }

    return cliente
  })

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
