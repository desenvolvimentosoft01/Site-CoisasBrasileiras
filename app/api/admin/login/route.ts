import { query } from "@/lib/db"
import { criarTokenSessao } from "@/lib/auth"
import { limiteExcedido, limparTentativas } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, senha } = await request.json()

  if (!email || !senha) {
    return NextResponse.json({ erro: "Informe email e senha" }, { status: 400 })
  }

  const chaveLimite = `admin:${email}`
  if (limiteExcedido(chaveLimite)) {
    return NextResponse.json(
      { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    )
  }

  const usuarios = await query(
    "SELECT id, nome, email, senha_hash, papel FROM TAB_USUARIO_ADMIN WHERE email = $1 AND ativo = true",
    [email]
  )

  if (usuarios.length === 0) {
    return NextResponse.json({ erro: "Email ou senha invalidos" }, { status: 401 })
  }

  const usuario = usuarios[0]
  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)

  if (!senhaCorreta) {
    return NextResponse.json({ erro: "Email ou senha invalidos" }, { status: 401 })
  }

  limparTentativas(chaveLimite)

  const token = await criarTokenSessao({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  })

  const response = NextResponse.json({
    sucesso: true,
    nome: usuario.nome,
    papel: usuario.papel,
  })

  response.cookies.set("admin_sessao", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return response
}
