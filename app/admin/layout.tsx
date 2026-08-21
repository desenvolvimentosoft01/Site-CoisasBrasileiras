import type { Metadata } from "next"
import { cookies } from "next/headers"
import { lerTokenSessao } from "@/lib/auth"
import { getConfiguracoes } from "@/lib/configuracoes"
import { carregarRecursos } from "@/lib/recursos-servidor"
import { rotuloPlanoParaCliente } from "@/lib/recursos"
import { CHAVES_COR_SISTEMA } from "@/lib/cores"
import { NOME_SISTEMA } from "@/lib/constantes"
import { AdminShell } from "@/components/admin/admin-shell"

// Titulo proprio da aba do admin - sobrescreve o titulo do site (definido no
// layout raiz) pra diferenciar as duas abas no navegador.
export const metadata: Metadata = {
  // O painel se identifica pelo SISTEMA, e nao pela loja: quem tem varias abas
  // abertas precisa distinguir "a loja" de "o sistema" pelo titulo e pelo
  // icone. O icone e a logo da agencia, em SVG (formato que o navegador aceita
  // como favicon e que fica nitido em qualquer tamanho de aba).
  title: `${NOME_SISTEMA} — Coisas Brasileiras`,
  icons: { icon: "/logo-sistema.svg" },
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
  const configuracoes = await getConfiguracoes([...CHAVES_COR_SISTEMA, "logo_url", "nome_loja", "plano"])
  const recursos = await carregarRecursos()

  return (
    <AdminShell
      sessao={sessao}
      coresSistema={configuracoes}
      nomeLoja={configuracoes.nome_loja || undefined}
      dominioBranco={process.env.DOMINIO_BRANCO}
      plano={rotuloPlanoParaCliente(configuracoes.plano || "avancado", recursos)}
    >
      {children}
    </AdminShell>
  )
}
