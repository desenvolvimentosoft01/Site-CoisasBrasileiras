import { query } from "@/lib/db"
import { UsuariosConteudo } from "@/components/admin/usuarios-conteudo"

export default async function UsuariosPage() {
  const usuarios = await query(
    "SELECT id, nome, email, papel, ativo, criado_em FROM TAB_USUARIO_ADMIN ORDER BY nome"
  )

  return <UsuariosConteudo usuariosIniciais={usuarios} />
}
