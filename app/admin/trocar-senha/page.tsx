import { cookies } from "next/headers"
import { lerTokenSessao } from "@/lib/auth"
import { TrocarSenhaConteudo } from "@/components/admin/trocar-senha-conteudo"

export default async function TrocarSenhaPage() {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessao(cookieStore.get("admin_sessao")?.value)

  return <TrocarSenhaConteudo obrigatoria={Boolean(sessao?.senhaProvisoria)} />
}
