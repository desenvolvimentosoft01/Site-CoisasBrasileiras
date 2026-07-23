import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { nome, papel, ativo, senha } = await request.json()

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

  const [usuario] = senha
    ? await query(
        `UPDATE TAB_USUARIO_ADMIN SET nome = $1, papel = $2, ativo = $3, senha_hash = $4
         WHERE id = $5
         RETURNING id, nome, email, papel, ativo, criado_em`,
        [nome.trim(), papel, ativo ?? true, await bcrypt.hash(senha, 10), id]
      )
    : await query(
        `UPDATE TAB_USUARIO_ADMIN SET nome = $1, papel = $2, ativo = $3
         WHERE id = $4
         RETURNING id, nome, email, papel, ativo, criado_em`,
        [nome.trim(), papel, ativo ?? true, id]
      )

  if (!usuario) {
    return NextResponse.json({ erro: "Usuario nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(usuario)
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
