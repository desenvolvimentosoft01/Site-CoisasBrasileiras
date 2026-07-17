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
    "SELECT id, nome, email, senha_hash FROM TAB_CLIENTE WHERE email = $1",
    [email]
  )

  if (clientes.length === 0) {
    return NextResponse.json({ erro: "Email ou senha invalidos" }, { status: 401 })
  }

  const cliente = clientes[0]
  const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash)

  if (!senhaCorreta) {
    return NextResponse.json({ erro: "Email ou senha invalidos" }, { status: 401 })
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

  return response
}
