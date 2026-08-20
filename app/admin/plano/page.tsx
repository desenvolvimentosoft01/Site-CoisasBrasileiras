import { query } from "@/lib/db"
import { carregarRecursos } from "@/lib/recursos-servidor"
import { PlanoConteudo } from "@/components/admin/plano-conteudo"

export default async function PlanoPage() {
  const [configuracao] = await query("SELECT valor FROM TAB_CONFIGURACAO WHERE chave = 'plano'")

  return (
    <PlanoConteudo
      planoInicial={configuracao?.valor ?? "avancado"}
      recursosIniciais={await carregarRecursos()}
    />
  )
}
