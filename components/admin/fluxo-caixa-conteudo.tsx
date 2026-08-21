"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LinhaFiltros, CampoFiltro } from "@/components/admin/linha-filtros"
import { Icone } from "@/components/admin/icone"
import { formatarMoeda } from "@/lib/mascaras"
import {
  agruparPorDia,
  type MovimentoCaixa,
  type PrevisaoDia,
  type ResumoCaixa,
} from "@/lib/fluxo-caixa-tipos"

function dataBr(data: string) {
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}

export function FluxoCaixaConteudo({
  movimentosIniciais,
  resumoInicial,
  previsao,
  dataInicialPadrao,
  dataFinalPadrao,
}: {
  movimentosIniciais: MovimentoCaixa[]
  resumoInicial: ResumoCaixa
  // A previsao nao depende do periodo filtrado - e sempre "daqui pra frente",
  // entao vem pronta do servidor e nao volta a cada pesquisa.
  previsao: PrevisaoDia[]
  dataInicialPadrao: string
  dataFinalPadrao: string
}) {
  const [dataInicial, setDataInicial] = useState(dataInicialPadrao)
  const [dataFinal, setDataFinal] = useState(dataFinalPadrao)
  const [movimentos, setMovimentos] = useState(movimentosIniciais)
  const [resumo, setResumo] = useState(resumoInicial)
  const [origem, setOrigem] = useState("")
  const [carregando, setCarregando] = useState(false)

  // O período vai ao servidor (é ele que soma o saldo anterior), mas o filtro
  // de origem é só recorte do que já está na tela - não precisa de ida ao banco.
  const movimentosFiltrados = useMemo(
    () => (origem ? movimentos.filter((movimento) => movimento.origem === origem) : movimentos),
    [movimentos, origem]
  )

  const dias = useMemo(() => agruparPorDia(movimentosFiltrados), [movimentosFiltrados])

  async function pesquisar() {
    setCarregando(true)
    try {
      const resposta = await fetch(
        `/api/admin/financeiro/fluxo-caixa?inicio=${dataInicial}&fim=${dataFinal}`
      )
      if (!resposta.ok) return
      const dados = await resposta.json()
      setMovimentos(dados.movimentos)
      setResumo(dados.resumo)
    } finally {
      setCarregando(false)
    }
  }

  // Atalho de mês: é assim que o dono pensa o caixa ("como foi agosto?"),
  // e digitar duas datas só pra dizer "este mês" é trabalho à toa.
  function aplicarMes(mesesAtras: number) {
    const hoje = new Date()
    const primeiro = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, 1)
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras + 1, 0)
    setDataInicial(primeiro.toISOString().slice(0, 10))
    setDataFinal(ultimo.toISOString().slice(0, 10))
  }

  function limparFiltros() {
    setDataInicial(dataInicialPadrao)
    setDataFinal(dataFinalPadrao)
    setOrigem("")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Fluxo de caixa</h1>
        <p className="text-sm text-slate-500">
          O dinheiro que entrou e saiu de verdade, pela data do pagamento. Conta que ainda não foi
          quitada não aparece aqui — ela é previsão, e fica em Contas a pagar/receber.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Entradas no período</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {formatarMoeda(resumo.entradas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Saídas no período</p>
            <p className="mt-1 text-2xl font-semibold text-red-600">{formatarMoeda(resumo.saidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Resultado do período</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                resumo.saldo < 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatarMoeda(resumo.saldo)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Saldo acumulado</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                resumo.saldoAcumulado < 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatarMoeda(resumo.saldoAcumulado)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Vinha {formatarMoeda(resumo.saldoAnterior)} de antes do período
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <LinhaFiltros
          aoPesquisar={pesquisar}
          aoLimpar={limparFiltros}
          temFiltro={dataInicial !== dataInicialPadrao || dataFinal !== dataFinalPadrao || !!origem}
          encontrados={movimentosFiltrados.length}
        >
          <CampoFiltro rotulo="De">
            <Input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="h-9 w-[150px]"
            />
          </CampoFiltro>
          <CampoFiltro rotulo="Até">
            <Input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="h-9 w-[150px]"
            />
          </CampoFiltro>
          <CampoFiltro rotulo="Origem">
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className="flex h-9 w-[170px] rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value="">Tudo</option>
              <option value="venda">Só vendas</option>
              <option value="conta">Só contas</option>
            </select>
          </CampoFiltro>
          <div className="flex h-9 items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-9" onClick={() => aplicarMes(0)}>
              Este mês
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => aplicarMes(1)}>
              Mês passado
            </Button>
          </div>
        </LinhaFiltros>

        <CardContent className="p-0">
          <Tabs defaultValue="dia">
            <TabsList className="m-3">
              <TabsTrigger value="dia">Por dia</TabsTrigger>
              <TabsTrigger value="movimento">Movimento a movimento</TabsTrigger>
              <TabsTrigger value="previsao">Previsão</TabsTrigger>
            </TabsList>

            <TabsContent value="dia" className="mt-0">
              {carregando ? (
                <p className="p-6 text-sm text-slate-500">Carregando...</p>
              ) : dias.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  Nenhuma entrada ou saída nesse período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-3 text-left">Dia</th>
                        <th className="p-3 text-right">Entradas</th>
                        <th className="p-3 text-right">Saídas</th>
                        <th className="p-3 text-right">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dias.map((dia) => (
                        <tr key={dia.data} className="border-b border-slate-100">
                          <td className="p-3">{dataBr(dia.data)}</td>
                          <td className="p-3 text-right text-emerald-600">
                            {dia.entradas ? formatarMoeda(dia.entradas) : "—"}
                          </td>
                          <td className="p-3 text-right text-red-600">
                            {dia.saidas ? formatarMoeda(dia.saidas) : "—"}
                          </td>
                          <td
                            className={`p-3 text-right font-medium ${
                              dia.saldo < 0 ? "text-red-600" : ""
                            }`}
                          >
                            {formatarMoeda(dia.saldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="movimento" className="mt-0">
              {carregando ? (
                <p className="p-6 text-sm text-slate-500">Carregando...</p>
              ) : movimentosFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  Nenhuma entrada ou saída nesse período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-3 text-left">Data</th>
                        <th className="p-3 text-left">Descrição</th>
                        <th className="p-3 text-left">Origem</th>
                        <th className="p-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimentosFiltrados.map((movimento, indice) => (
                        <tr
                          key={`${movimento.data}-${movimento.descricao}-${indice}`}
                          className="border-b border-slate-100"
                        >
                          <td className="p-3 whitespace-nowrap">{dataBr(movimento.data)}</td>
                          <td className="p-3">{movimento.descricao}</td>
                          <td className="p-3 text-xs text-slate-500">
                            {movimento.origem === "venda" ? "Venda" : "Conta"}
                          </td>
                          <td
                            className={`p-3 text-right font-medium whitespace-nowrap ${
                              movimento.tipo === "entrada" ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              <Icone
                                nome={movimento.tipo === "entrada" ? "mais" : "menos"}
                                tamanho={14}
                              />
                              {formatarMoeda(movimento.valor)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="previsao" className="mt-0">
              <p className="px-3 pb-2 text-xs text-slate-500">
                Contas em aberto dos próximos 30 dias, pela data de vencimento. O saldo projetado
                parte do caixa real de hoje — é uma previsão, não dinheiro que já entrou. Conta
                vencida e não paga aparece no primeiro dia, marcada como atrasada.
              </p>
              {previsao.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  Nenhuma conta em aberto para os próximos 30 dias.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-3 text-left">Vencimento</th>
                        <th className="p-3 text-right">A receber</th>
                        <th className="p-3 text-right">A pagar</th>
                        <th className="p-3 text-right">Saldo projetado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previsao.map((dia) => (
                        <tr key={dia.data} className="border-b border-slate-100">
                          <td className="p-3 whitespace-nowrap">
                            {dataBr(dia.data)}
                            {dia.atrasado && (
                              <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                                <Icone nome="alerta" tamanho={13} />
                                Inclui contas atrasadas
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right text-emerald-600">
                            {dia.aReceber ? formatarMoeda(dia.aReceber) : "—"}
                          </td>
                          <td className="p-3 text-right text-red-600">
                            {dia.aPagar ? formatarMoeda(dia.aPagar) : "—"}
                          </td>
                          <td
                            className={`p-3 text-right font-medium ${
                              dia.saldoProjetado < 0 ? "text-red-600" : ""
                            }`}
                          >
                            {formatarMoeda(dia.saldoProjetado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
