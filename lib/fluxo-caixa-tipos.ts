// Tipos e agrupamento do fluxo de caixa, sem nada de banco.
//
// Existe separado de `lib/fluxo-caixa.ts` porque a tela e client component:
// importar de la arrastaria `lib/db` (e o `pg`) pro bundle do navegador, e o
// build quebra com "Can't resolve 'dns'". Mesmo motivo do par
// recursos.ts / recursos-servidor.ts.
export type MovimentoCaixa = {
  data: string
  tipo: "entrada" | "saida"
  origem: "venda" | "conta"
  descricao: string
  categoria: string | null
  valor: number
}

export type ResumoCaixa = {
  entradas: number
  saidas: number
  saldo: number
  saldoAnterior: number
  saldoAcumulado: number
}

export type DiaCaixa = { data: string; entradas: number; saidas: number; saldo: number }

// Agrupado por dia, do mais recente pro mais antigo - e assim que o dono
// confere o caixa ("quanto entrou ontem?"), e nao movimento a movimento.
export function agruparPorDia(movimentos: MovimentoCaixa[]): DiaCaixa[] {
  const mapa = new Map<string, DiaCaixa>()

  for (const movimento of movimentos) {
    const dia = mapa.get(movimento.data) ?? { data: movimento.data, entradas: 0, saidas: 0, saldo: 0 }
    if (movimento.tipo === "entrada") dia.entradas += movimento.valor
    else dia.saidas += movimento.valor
    dia.saldo = dia.entradas - dia.saidas
    mapa.set(movimento.data, dia)
  }

  return Array.from(mapa.values()).sort((a, b) => (a.data < b.data ? 1 : -1))
}

// Previsao: conta em aberto, pela data de VENCIMENTO. Fica separada do
// realizado de proposito - misturar as duas e o jeito mais rapido de achar
// que tem dinheiro que ainda nao entrou.
export type PrevisaoDia = {
  data: string
  aReceber: number
  aPagar: number
  // Saldo projetado ate esse dia, ja partindo do saldo real de hoje.
  saldoProjetado: number
  atrasado: boolean
}
