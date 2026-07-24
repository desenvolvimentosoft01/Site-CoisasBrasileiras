import { query } from "@/lib/db"
import { criarTokenSessao } from "@/lib/auth"
import { limiteExcedido, limparTentativas } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { login, senha } = await request.json()

  if (!login || !senha) {
    return NextResponse.json({ erro: "Informe usuario/email e senha" }, { status: 400 })
  }

  const chaveLimite = `admin:${login}`
  if (limiteExcedido(chaveLimite)) {
    return NextResponse.json(
      { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    )
  }

  // Aceita tanto o "usuario" (login curto, opcional) quanto o e-mail
  // completo - mesma regra do InMenteGestao, so que la o padrao (quando
  // "usuario" nao e definido) e o prefixo do e-mail; aqui simplificamos pra
  // exigir e-mail completo quando "usuario" nao foi cadastrado, sem inferir
  // prefixo (evita ambiguidade entre dois e-mails com o mesmo prefixo).
  const usuarios = await query(
    "SELECT id, nome, email, senha_hash, papel FROM TAB_USUARIO_ADMIN WHERE (email = $1 OR usuario = $1) AND ativo = true",
    [login]
  )

  if (usuarios.length === 0) {
    return NextResponse.json({ erro: "Usuario/email ou senha invalidos" }, { status: 401 })
  }

  const usuario = usuarios[0]
  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)

  if (!senhaCorreta) {
    return NextResponse.json({ erro: "Usuario/email ou senha invalidos" }, { status: 401 })
  }

  limparTentativas(chaveLimite)

  await query("UPDATE TAB_USUARIO_ADMIN SET ultimo_login = NOW() WHERE id = $1", [usuario.id])

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
