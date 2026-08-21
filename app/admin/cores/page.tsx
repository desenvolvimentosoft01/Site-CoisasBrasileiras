import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { lerTokenSessao, EMAIL_DESENVOLVEDOR } from "@/lib/auth"
import { query } from "@/lib/db"
import { getConfiguracoesMarca } from "@/lib/configuracoes"
import { CHAVES_COR_TEMA, CHAVES_COR_SISTEMA } from "@/lib/cores"
import { CoresConteudo } from "@/components/admin/cores-conteudo"

export default async function CoresPage() {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessao(cookieStore.get("admin_sessao")?.value)

  // O middleware ja bloqueia quem nao e o desenvolvedor, isso aqui e so uma
  // segunda camada (defesa em profundidade) caso a pagina seja renderizada
  // por algum outro caminho no futuro.
  if (!sessao || sessao.email !== EMAIL_DESENVOLVEDOR) {
    redirect("/admin/dashboard")
  }

  const linhas = await query(
    "SELECT chave, valor FROM TAB_CONFIGURACAO WHERE chave = ANY($1)",
    [CHAVES_COR_TEMA]
  )
  const coresColorido: Record<string, string> = {}
  for (const linha of linhas) {
    coresColorido[linha.chave] = linha.valor ?? ""
  }

  const coresBranco = await getConfiguracoesMarca(CHAVES_COR_TEMA, "branco")

  // Paleta do painel: mora em TAB_CONFIGURACAO como a do site colorido, mas em
  // chaves proprias (cor_sistema_*) - o painel deixou de herdar a cor da
  // vitrine em 2026-08-20.
  const linhasSistema = await query(
    "SELECT chave, valor FROM TAB_CONFIGURACAO WHERE chave = ANY($1)",
    [CHAVES_COR_SISTEMA]
  )
  const coresSistema: Record<string, string> = {}
  for (const linha of linhasSistema) {
    coresSistema[linha.chave] = linha.valor ?? ""
  }

  return (
    <CoresConteudo
      coresColoridoIniciais={coresColorido}
      coresBrancoIniciais={coresBranco}
      coresSistemaIniciais={coresSistema}
    />
  )
}
