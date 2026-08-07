import { query } from "@/lib/db"
import { criarTokenSessaoCliente } from "@/lib/auth"
import { limiteExcedido, limparTentativas } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, senha } = await request.json()

  if (!email || !senha) {
    return NextResponse.json({ erro: "Informe email e senha" }, { status: 400 })
  }

  const chaveLimite = `cliente:${email}`
  if (limiteExcedido(chaveLimite)) {
    return NextResponse.json(
      { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    )
  }

  const clientes = await query(
    "SELECT id, nome, email, senha_hash, ativo FROM TAB_CLIENTE WHERE email = $1",
    [email]
  )

  if (clientes.length === 0) {
    return NextResponse.json({ erro: "Email ou senha inválidos" }, { status: 401 })
  }

  const cliente = clientes[0]

  // Cliente inativado pelo admin nao consegue mais entrar no site - o
  // cadastro e o historico de pedidos continuam intactos, so o acesso e
  // bloqueado. Mensagem generica de proposito, igual ao caso de senha errada,
  // pra nao revelar pra quem tenta logar que a conta existe mas foi bloqueada.
  if (!cliente.ativo) {
    return NextResponse.json({ erro: "Email ou senha inválidos" }, { status: 401 })
  }

  const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash)

  if (!senhaCorreta) {
    return NextResponse.json({ erro: "Email ou senha inválidos" }, { status: 401 })
  }

  limparTentativas(chaveLimite)

  const token = await criarTokenSessaoCliente({
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
  })

  const response = NextResponse.json({ sucesso: true, nome: cliente.nome })
  response.cookies.set("cliente_sessao", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })

  // DEBUG TEMPORARIO - remover apos diagnosticar loop de login
  console.log("[debug-auth] login OK", {
    host: request.headers.get("host"),
    proto: request.headers.get("x-forwarded-proto"),
    nodeEnv: process.env.NODE_ENV,
    origin: request.headers.get("origin"),
  })

  return response
}
