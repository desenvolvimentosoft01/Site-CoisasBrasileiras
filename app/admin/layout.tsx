import type { Metadata } from "next"
import { cookies } from "next/headers"
import { lerTokenSessao } from "@/lib/auth"
import { getConfiguracoes } from "@/lib/configuracoes"
import { AdminShell } from "@/components/admin/admin-shell"

// Titulo proprio da aba do admin - sobrescreve o titulo do site (definido no
// layout raiz) pra diferenciar as duas abas no navegador.
export const metadata: Metadata = {
  title: "Coisas Brasileiras — Sistema",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessao(cookieStore.get("admin_sessao")?.value)

  // O middleware ja redireciona para /admin/entrar quando nao ha sessao,
  // mas a pagina de login em si passa por este layout tambem.
  if (!sessao) {
    return <>{children}</>
  }

  // Mesma cor primaria configurada em Configuracoes > Aparencia (a que o site
  // publico usa) - o admin usa a cor de verdade da loja em vez de uma cor fixa
  // propria, pra nao destoar visualmente do site.
  const { cor_primaria } = await getConfiguracoes(["cor_primaria"])

  return (
    <AdminShell sessao={sessao} corPrimaria={cor_primaria || "#047857"}>
      {children}
    </AdminShell>
  )
}
