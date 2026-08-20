import { query, transacao } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  // "veio_do_site" = tem senha cadastrada, ou seja, o cliente se registrou e
  // faz login no site. Clientes criados pelo admin (contatos de balcao) nao
  // tem senha, entao aparecem como cadastrados no balcao.
  const clientes = await query(
    `SELECT id, codigo, nome, email, telefone, cpf_cnpj, ativo, criado_em,
       (senha_hash IS NOT NULL) AS veio_do_site
     FROM TAB_CLIENTE ORDER BY nome`
  )
  return NextResponse.json(clientes)
}

// Cadastro de cliente feito pelo admin (contato de balcao). E-mail e opcional
// - clientes sem e-mail simplesmente nao logam no site (sao so contatos).
export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome, telefone, cpf_cnpj, email, cep, logradouro, numero, complemento, bairro, cidade, estado } =
    await request.json()

  if (!nome || !nome.trim()) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 })
  }

  // So checa duplicidade de e-mail quando ele foi informado - varios clientes
  // de balcao podem existir sem e-mail (NULL nao conflita no indice UNIQUE).
  if (email?.trim()) {
    const existente = await query("SELECT id FROM TAB_CLIENTE WHERE email = $1", [email.trim()])
    if (existente.length > 0) {
      return NextResponse.json({ erro: "Já existe um cliente com esse e-mail" }, { status: 409 })
    }
  }

  try {
    // Cliente + endereco numa unica transacao - se o INSERT do endereco
    // falhar, o cliente tambem nao fica gravado (sem isso, sobraria um
    // cliente orfao sem endereco no ar).
    const cliente = await transacao(async (q) => {
      const [cliente] = await q(
        `INSERT INTO TAB_CLIENTE (nome, email, telefone, cpf_cnpj)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nome, email, telefone, cpf_cnpj, criado_em`,
        [nome.trim(), email?.trim() || null, telefone || null, cpf_cnpj || null]
      )

      if (cep && logradouro) {
        await q(
          `INSERT INTO TAB_ENDERECO (cliente_id, cep, logradouro, numero, complemento, bairro, cidade, estado, principal)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
          [cliente.id, cep, logradouro, numero || "", complemento || null, bairro || "", cidade || "", estado || ""]
        )
      }

      return cliente
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (erro) {
    // 23505 = violacao de unique (ex: CPF/CNPJ ja cadastrado).
    if (erro instanceof Error && "code" in erro && erro.code === "23505") {
      return NextResponse.json(
        { erro: "Já existe um cliente com esse CPF/CNPJ ou e-mail" },
        { status: 409 }
      )
    }
    throw erro
  }
}
