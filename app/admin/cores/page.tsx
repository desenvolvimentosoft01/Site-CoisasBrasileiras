import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { lerTokenSessao, EMAIL_DESENVOLVEDOR } from "@/lib/auth"
import { query } from "@/lib/db"
import { CHAVES_COR_TEMA } from "@/lib/cores"
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
  const coresIniciais: Record<string, string> = {}
  for (const linha of linhas) {
    coresIniciais[linha.chave] = linha.valor ?? ""
  }

  return <CoresConteudo coresIniciais={coresIniciais} />
}
