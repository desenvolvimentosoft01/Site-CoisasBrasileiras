import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { carregarPermissoes, salvarPermissoes } from "@/lib/permissoes-servidor"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
import { NextResponse } from "next/server"

// Permissões de tela de um usuário (migration 063). Só admin: quem define o
// que os outros podem ver não pode ser quem tem o acesso restrito.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  return NextResponse.json(await carregarPermissoes(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const permissoes: Record<string, boolean> = await request.json()

  const [usuario] = await query("SELECT nome, papel FROM TAB_USUARIO_ADMIN WHERE id = $1", [id])
  if (!usuario) {
    return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 })
  }

  // Admin enxerga tudo por definição - gravar exceção pra ele criaria a
  // ilusão de um bloqueio que o sistema ignora na hora de abrir a tela.
  if (usuario.papel === "admin") {
    return NextResponse.json(
      { erro: "Administrador tem acesso a todas as telas. Para restringir, mude o papel para operador." },
      { status: 400 }
    )
  }

  const antes = await carregarPermissoes(id)
  await salvarPermissoes(id, permissoes)

  // Auditoria no servidor, e nao pela tela: mudanca de permissao e do tipo que
  // precisa de rastro mesmo quando feita por fora da interface.
  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Usuários",
    acao: "edicao",
    tabela: "TAB_USUARIO_PERMISSAO",
    registroId: id,
    antes: { usuario: usuario.nome, permissoes: antes },
    depois: { usuario: usuario.nome, permissoes: await carregarPermissoes(id) },
  })

  return NextResponse.json({ sucesso: true })
}
