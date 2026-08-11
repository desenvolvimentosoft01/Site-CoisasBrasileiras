import { query } from "@/lib/db"
import { criarTokenSessaoCliente } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { nome, email, senha, telefone, aceitouTermos } = await request.json()

  if (!nome?.trim() || !email?.trim() || !senha) {
    return NextResponse.json({ erro: "Nome, email e senha são obrigatórios" }, { status: 400 })
  }

  if (senha.length < 6) {
    return NextResponse.json({ erro: "A senha precisa ter pelo menos 6 caracteres" }, { status: 400 })
  }

  // Exigido pela LGPD (art. 8o) - o aceite precisa ser uma acao explicita do
  // titular, entao o cadastro so segue com a caixa marcada.
  if (!aceitouTermos) {
    return NextResponse.json(
      { erro: "É preciso aceitar a Política de Privacidade e os Termos de Uso" },
      { status: 400 }
    )
  }

  const existente = await query("SELECT id FROM TAB_CLIENTE WHERE email = $1", [email.trim()])
  if (existente.length > 0) {
    return NextResponse.json({ erro: "Já existe uma conta com esse email" }, { status: 409 })
  }

  const senhaHash = await bcrypt.hash(senha, 10)

  const [cliente] = await query(
    `INSERT INTO TAB_CLIENTE (nome, email, telefone, senha_hash, consentimento_lgpd_em)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING id, nome, email`,
    [nome.trim(), email.trim(), telefone || null, senhaHash]
  )

  const token = await criarTokenSessaoCliente(cliente)

  const response = NextResponse.json({ sucesso: true, nome: cliente.nome })
  response.cookies.set("cliente_sessao", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })

  return response
}
