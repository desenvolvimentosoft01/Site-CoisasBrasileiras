import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, papel, ativo, senha, usuario } = await request.json()

  if (!nome?.trim()) {
    return NextResponse.json({ erro: "Nome e obrigatorio" }, { status: 400 })
  }
  if (papel !== "admin" && papel !== "operador") {
    return NextResponse.json({ erro: "Papel invalido" }, { status: 400 })
  }
  // Ninguem pode rebaixar ou desativar a si mesmo - evita ficar sem admin.
  if (id === sessaoOuErro.id && (papel !== "admin" || ativo === false)) {
    return NextResponse.json(
      { erro: "Voce nao pode rebaixar ou desativar seu proprio usuario" },
      { status: 400 }
    )
  }
  if (senha && senha.length < 8) {
    return NextResponse.json({ erro: "A senha precisa ter pelo menos 8 caracteres" }, { status: 400 })
  }

  const usuarioLogin = usuario?.trim() || null
  if (usuarioLogin) {
    const conflito = await query(
      "SELECT id FROM TAB_USUARIO_ADMIN WHERE lower(usuario) = lower($1) AND id != $2",
      [usuarioLogin, id]
    )
    if (conflito.length > 0) {
      return NextResponse.json({ erro: "Ja existe um usuario com esse nome de usuario" }, { status: 409 })
    }
  }

  const [usuarioAtualizado] = senha
    ? await query(
        `UPDATE TAB_USUARIO_ADMIN SET nome = $1, papel = $2, ativo = $3, usuario = $4, senha_hash = $5
         WHERE id = $6
         RETURNING id, nome, email, usuario, papel, ativo, criado_em, ultimo_login`,
        [nome.trim(), papel, ativo ?? true, usuarioLogin, await bcrypt.hash(senha, 10), id]
      )
    : await query(
        `UPDATE TAB_USUARIO_ADMIN SET nome = $1, papel = $2, ativo = $3, usuario = $4
         WHERE id = $5
         RETURNING id, nome, email, usuario, papel, ativo, criado_em, ultimo_login`,
        [nome.trim(), papel, ativo ?? true, usuarioLogin, id]
      )

  if (!usuarioAtualizado) {
    return NextResponse.json({ erro: "Usuario nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(usuarioAtualizado)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  if (id === sessaoOuErro.id) {
    return NextResponse.json({ erro: "Voce nao pode excluir seu proprio usuario" }, { status: 400 })
  }

  await query("DELETE FROM TAB_USUARIO_ADMIN WHERE id = $1", [id])

  return NextResponse.json({ sucesso: true })
}
