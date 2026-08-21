import { listarMovimentosCaixa, projecaoCaixa, resumoCaixa } from "@/lib/fluxo-caixa"
import { FluxoCaixaConteudo } from "@/components/admin/fluxo-caixa-conteudo"

export default async function FluxoCaixaPage() {
  // Abre no mes corrente: e o periodo que o dono olha todo dia. Os outros
  // ficam a um clique nos atalhos "Este mes" / "Mes passado".
  const hoje = new Date()
  const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [movimentos, resumo, previsao] = await Promise.all([
    listarMovimentosCaixa(primeiro, ultimo),
    resumoCaixa(primeiro, ultimo),
    projecaoCaixa(),
  ])

  return (
    <FluxoCaixaConteudo
      movimentosIniciais={movimentos}
      resumoInicial={resumo}
      previsao={previsao}
      dataInicialPadrao={primeiro}
      dataFinalPadrao={ultimo}
    />
  )
}
