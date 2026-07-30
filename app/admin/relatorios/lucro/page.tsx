import { calcularDRE, periodoAnterior } from "@/lib/relatorio-lucro"
import { RelatorioLucroConteudo } from "@/components/admin/relatorio-lucro-conteudo"

export default async function RelatorioLucroPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>
}) {
  const { inicio, fim } = await searchParams

  const hoje = new Date()
  const inicioDefault = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const fimDefault = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
  const inicioPeriodo = inicio || inicioDefault
  const fimPeriodo = fim || fimDefault

  const anterior = periodoAnterior(inicioPeriodo, fimPeriodo)

  const [dre, dreAnterior] = await Promise.all([
    calcularDRE(`${inicioPeriodo}T00:00:00`, `${fimPeriodo}T23:59:59`, inicioPeriodo, fimPeriodo),
    calcularDRE(`${anterior.inicio}T00:00:00`, `${anterior.fim}T23:59:59`, anterior.inicio, anterior.fim),
  ])

  return (
    <RelatorioLucroConteudo
      dre={dre}
      dreAnterior={dreAnterior}
      inicioPeriodo={inicioPeriodo}
      fimPeriodo={fimPeriodo}
      periodoAnteriorLabel={`${anterior.inicio} a ${anterior.fim}`}
    />
  )
}
