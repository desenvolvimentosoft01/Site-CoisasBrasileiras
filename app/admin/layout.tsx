import type { Metadata } from "next"
import { cookies } from "next/headers"
import { lerTokenSessao } from "@/lib/auth"
import { getConfiguracoes } from "@/lib/configuracoes"
import { carregarRecursos, rotuloPlanoParaCliente } from "@/lib/recursos"
import { CHAVES_COR_TEMA } from "@/lib/cores"
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

  // Mesma paleta configurada em Configuracoes > Aparencia / Cores do Sistema
  // (a que o site publico usa) - o admin usa as cores de verdade da loja em
  // vez de cores fixas proprias, pra nao destoar visualmente do site.
  const configuracoes = await getConfiguracoes([...CHAVES_COR_TEMA, "logo_url", "nome_loja", "plano"])
  const recursos = await carregarRecursos()

  return (
    <AdminShell
      sessao={sessao}
      cores={configuracoes}
      logoUrl={configuracoes.logo_url || undefined}
      nomeLoja={configuracoes.nome_loja || undefined}
      dominioBranco={process.env.DOMINIO_BRANCO}
      plano={rotuloPlanoParaCliente(configuracoes.plano || "avancado", recursos)}
    >
      {children}
    </AdminShell>
  )
}
