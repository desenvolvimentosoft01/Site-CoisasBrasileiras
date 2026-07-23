import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const usuarios = await query(
    "SELECT id, nome, email, papel, ativo, criado_em FROM TAB_USUARIO_ADMIN ORDER BY nome"
  )
  return NextResponse.json(usuarios)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { nome, email, senha, papel } = await request.json()

  if (!nome?.trim() || !email?.trim() || !senha) {
    return NextResponse.json({ erro: "Nome, email e senha sao obrigatorios" }, { status: 400 })
  }
  if (senha.length < 8) {
    return NextResponse.json({ erro: "A senha precisa ter pelo menos 8 caracteres" }, { status: 400 })
  }
  if (papel !== "admin" && papel !== "operador") {
    return NextResponse.json({ erro: "Papel invalido" }, { status: 400 })
  }

  const existente = await query("SELECT id FROM TAB_USUARIO_ADMIN WHERE email = $1", [email.trim()])
  if (existente.length > 0) {
    return NextResponse.json({ erro: "Ja existe um usuario com esse email" }, { status: 409 })
  }

  const senhaHash = await bcrypt.hash(senha, 10)

  const [usuario] = await query(
    `INSERT INTO TAB_USUARIO_ADMIN (nome, email, senha_hash, papel)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nome, email, papel, ativo, criado_em`,
    [nome.trim(), email.trim(), senhaHash, papel]
  )

  return NextResponse.json(usuario, { status: 201 })
}
