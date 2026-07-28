"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatarMoeda } from "@/lib/mascaras"
import { AlertTriangle, ArrowDownAZ, ArrowUpAZ, Filter, X } from "lucide-react"
import { BotaoImprimir } from "@/components/admin/botao-imprimir"
import { LabelCanal } from "@/components/admin/label-canal"
import type { CanalPedido } from "@/lib/canal-pedido"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

export type Relatorio = {
  vendasPorDia: { dia: string; total: string }[]
  produtosMaisVendidos: { nome: string; quantidade: string; faturamento: string }[]
  resumo: { total_pedidos: string; faturamento_total: string; ticket_medio: string }
  vendasPorOrigem: { origem: "site" | "balcao"; total_pedidos: string; faturamento: string }[]
  resumoEstoque: {
    total_produtos: string
    unidades_em_estoque: string
    valor_em_estoque: string
    produtos_em_baixa: string
  }
  produtosEmBaixa: { id: string; nome: string; sku: string | null; estoque: number; estoque_minimo: number }[]
}

export type PedidoRelatorio = {
  id: string
  status: string
  total: string
  origem: "site" | "balcao"
  canal: CanalPedido | null
  criado_em: string
  cliente_nome: string
  tipo_entrega: string | null
  categorias: string[]
}

const ROTULOS_STATUS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

const TODOS = "__todos__"

function formatarDia(dia: string) {
  const [, mes, diaNum] = dia.split("-")
  return `${diaNum}/${mes}`
}

export function RelatoriosConteudo({
  dados,
  pedidosPeriodo,
  categorias,
  inicioPeriodo,
  fimPeriodo,
}: {
  dados: Relatorio
  pedidosPeriodo: PedidoRelatorio[]
  categorias: { id: string; nome: string }[]
  inicioPeriodo: string
  fimPeriodo: string
}) {
  const grafico = dados.vendasPorDia.map((v) => ({
    dia: formatarDia(v.dia),
    total: Number(v.total),
  }))

  const [filtroCanal, setFiltroCanal] = useState(TODOS)
  const [filtroStatus, setFiltroStatus] = useState(TODOS)
  const [filtroEntrega, setFiltroEntrega] = useState(TODOS)
  const [filtroCategoria, setFiltroCategoria] = useState(TODOS)
  const [ordemVendidos, setOrdemVendidos] = useState<"desc" | "asc">("desc")

  const produtosMaisVendidosOrdenados = useMemo(() => {
    const copia = [...dados.produtosMaisVendidos]
    copia.sort((a, b) =>
      ordemVendidos === "desc" ? Number(b.quantidade) - Number(a.quantidade) : Number(a.quantidade) - Number(b.quantidade)
    )
    return copia
  }, [dados.produtosMaisVendidos, ordemVendidos])

  // "Hoje" so faz sentido se o periodo escolhido cobrir a data de hoje - fora
  // disso (ex: relatorio de um mes passado) a lista fica vazia de proposito,
  // nao e um bug.
  const hojeISO = new Date().toISOString().slice(0, 10)
  const pedidosHoje = useMemo(
    () =>
      pedidosPeriodo.filter(
        (p) => p.status === "pago" && new Date(p.criado_em).toISOString().slice(0, 10) === hojeISO
      ),
    [pedidosPeriodo, hojeISO]
  )
  const faturamentoHoje = pedidosHoje.reduce((soma, p) => soma + Number(p.total), 0)

  const tiposEntrega = useMemo(
    () => Array.from(new Set(pedidosPeriodo.map((p) => p.tipo_entrega).filter(Boolean) as string[])).sort(),
    [pedidosPeriodo]
  )

  const pedidosFiltrados = useMemo(() => {
    return pedidosPeriodo.filter((p) => {
      const canalPedido = p.canal ?? (p.origem === "balcao" ? "balcao" : "site")
      if (filtroCanal !== TODOS && canalPedido !== filtroCanal) return false
      if (filtroStatus !== TODOS && p.status !== filtroStatus) return false
      if (filtroEntrega === "__sem_entrega__" && p.tipo_entrega) return false
      else if (filtroEntrega !== TODOS && filtroEntrega !== "__sem_entrega__" && p.tipo_entrega !== filtroEntrega)
        return false
      if (filtroCategoria !== TODOS && !p.categorias.includes(filtroCategoria)) return false
      return true
    })
  }, [pedidosPeriodo, filtroCanal, filtroStatus, filtroEntrega, filtroCategoria])

  const filtrosAtivos =
    filtroCanal !== TODOS || filtroStatus !== TODOS || filtroEntrega !== TODOS || filtroCategoria !== TODOS

  function limparFiltrosPedidos() {
    setFiltroCanal(TODOS)
    setFiltroStatus(TODOS)
    setFiltroEntrega(TODOS)
    setFiltroCategoria(TODOS)
  }

  function aplicarCamposOcultos(camposOcultos: Record<string, boolean>) {
    for (const [secao, oculto] of Object.entries(camposOcultos)) {
      document.querySelectorAll<HTMLElement>(`[data-print-section="${secao}"]`).forEach((el) => {
        el.style.display = oculto ? "none" : ""
      })
    }
    // Restaura depois de imprimir - senao a secao fica escondida na tela tambem.
    setTimeout(() => {
      document.querySelectorAll<HTMLElement>("[data-print-section]").forEach((el) => {
        el.style.display = ""
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Relatorios</h1>

        <div className="flex flex-wrap items-end gap-2">
          {/* Form GET simples - recarrega a pagina com o periodo escolhido,
              sem precisar de estado client pra isso. */}
          <form action="/admin/relatorios" method="get" className="flex items-end gap-2 print:hidden">
            <div className="space-y-1">
              <Label className="text-xs">De</Label>
              <Input type="date" name="inicio" defaultValue={inicioPeriodo} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ate</Label>
              <Input type="date" name="fim" defaultValue={fimPeriodo} className="w-40" />
            </div>
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>
          <BotaoImprimir
            descricaoPeriodo={`Periodo: ${inicioPeriodo} a ${fimPeriodo}`}
            campos={[
              { chave: "hoje", rotulo: "Vendas de hoje" },
              { chave: "resumo", rotulo: "Resumo (pedidos, faturamento, ticket)" },
              { chave: "grafico", rotulo: "Grafico de vendas" },
              { chave: "origem", rotulo: "Vendas por origem" },
              { chave: "maisVendidos", rotulo: "Produtos mais vendidos" },
              { chave: "estoque", rotulo: "Posicao de estoque" },
              { chave: "pedidos", rotulo: "Lista de pedidos" },
            ]}
            onCamposOcultos={aplicarCamposOcultos}
          />
        </div>
      </div>

      <div data-print-section="hoje" className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Vendas de hoje</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{pedidosHoje.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Faturamento de hoje</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{formatarMoeda(String(faturamentoHoje))}</CardContent>
        </Card>
      </div>

      <div data-print-section="resumo" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Pedidos pagos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{dados.resumo.total_pedidos}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Faturamento no periodo</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatarMoeda(dados.resumo.faturamento_total)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Ticket medio</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatarMoeda(dados.resumo.ticket_medio)}
          </CardContent>
        </Card>
      </div>

      <Card data-print-section="grafico">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Vendas no periodo</CardTitle>
        </CardHeader>
        <CardContent>
          {grafico.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma venda no periodo.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={grafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="dia" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #333" }}
                    formatter={(valor) => formatarMoeda(Number(valor))}
                  />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-print-section="origem">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Vendas por origem</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dados.vendasPorOrigem.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">Nenhuma venda no periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Origem</th>
                    <th className="p-4 font-medium">Pedidos</th>
                    <th className="p-4 font-medium">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.vendasPorOrigem.map((linha) => (
                    <tr key={linha.origem} className="border-b border-slate-200 last:border-0">
                      <td className="p-4 capitalize">{linha.origem === "balcao" ? "Balcao" : "Site"}</td>
                      <td className="p-4">{linha.total_pedidos}</td>
                      <td className="p-4">{formatarMoeda(linha.faturamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-print-section="maisVendidos">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm text-slate-500">Produtos mais vendidos no periodo</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="print:hidden"
            onClick={() => setOrdemVendidos((atual) => (atual === "desc" ? "asc" : "desc"))}
          >
            {ordemVendidos === "desc" ? (
              <>
                <ArrowDownAZ size={14} className="mr-1.5" />
                Mais vendidos
              </>
            ) : (
              <>
                <ArrowUpAZ size={14} className="mr-1.5" />
                Menos vendidos
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {produtosMaisVendidosOrdenados.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">Nenhuma venda no periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">Quantidade</th>
                    <th className="p-4 font-medium">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosMaisVendidosOrdenados.map((produto, i) => (
                    <tr key={i} className="border-b border-slate-200 last:border-0">
                      <td className="p-4">{produto.nome}</td>
                      <td className="p-4">{produto.quantidade}</td>
                      <td className="p-4">{formatarMoeda(produto.faturamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div data-print-section="estoque">
        <h2 className="mb-3 text-lg font-semibold">Estoque (posicao atual)</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Produtos ativos</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {dados.resumoEstoque.total_produtos}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Unidades em estoque</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {dados.resumoEstoque.unidades_em_estoque}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Valor em estoque</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {formatarMoeda(dados.resumoEstoque.valor_em_estoque)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm text-slate-500">
                <AlertTriangle size={14} className="text-amber-500" />
                Em baixa
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-amber-500">
              {dados.resumoEstoque.produtos_em_baixa}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card data-print-section="estoque">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Produtos com estoque baixo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dados.produtosEmBaixa.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">Nenhum produto em baixa.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">SKU</th>
                    <th className="p-4 font-medium">Minimo</th>
                    <th className="p-4 font-medium">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.produtosEmBaixa.map((produto) => (
                    <tr key={produto.id} className="border-b border-slate-200 last:border-0">
                      <td className="p-4">
                        <Link href="/admin/estoque" className="hover:underline">
                          {produto.nome}
                        </Link>
                      </td>
                      <td className="p-4 text-slate-500">{produto.sku || "-"}</td>
                      <td className="p-4 text-slate-500">{produto.estoque_minimo}</td>
                      <td className="p-4 font-medium text-amber-500">{produto.estoque}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Pedidos do periodo</h2>

        <Card className="mb-4 print:hidden">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Filter size={14} />
              Filtros
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Canal</Label>
                <Select value={filtroCanal} onValueChange={(v) => setFiltroCanal(v || TODOS)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todos os canais</SelectItem>
                    <SelectItem value="site">
                      <LabelCanal canal="site" />
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <LabelCanal canal="whatsapp" />
                    </SelectItem>
                    <SelectItem value="instagram">
                      <LabelCanal canal="instagram" />
                    </SelectItem>
                    <SelectItem value="balcao">
                      <LabelCanal canal="balcao" />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs">Status</Label>
                <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v || TODOS)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todos os status</SelectItem>
                    {Object.entries(ROTULOS_STATUS).map(([valor, rotulo]) => (
                      <SelectItem key={valor} value={valor}>
                        {rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs">Entrega</Label>
                <Select value={filtroEntrega} onValueChange={(v) => setFiltroEntrega(v || TODOS)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todas as vendas</SelectItem>
                    <SelectItem value="__sem_entrega__">Somente sem entrega</SelectItem>
                    {tiposEntrega.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={filtroCategoria} onValueChange={(v) => setFiltroCategoria(v || TODOS)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todas as categorias</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.nome}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filtrosAtivos && (
                <Button size="sm" variant="outline" onClick={limparFiltrosPedidos}>
                  <X size={14} className="mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mb-2 text-xs text-muted-foreground">
          {pedidosFiltrados.length} pedido{pedidosFiltrados.length === 1 ? "" : "s"} encontrado
          {pedidosFiltrados.length === 1 ? "" : "s"}
        </p>

        <Card data-print-section="pedidos">
          <CardContent className="p-0">
            {pedidosFiltrados.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">Nenhum pedido encontrado com esses filtros.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="p-4 font-medium">Data</th>
                      <th className="p-4 font-medium">Cliente</th>
                      <th className="p-4 font-medium">Canal</th>
                      <th className="p-4 font-medium">Entrega</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosFiltrados.map((pedido) => (
                      <tr key={pedido.id} className="border-b border-slate-200 last:border-0">
                        <td className="p-4 whitespace-nowrap text-slate-500">
                          {new Date(pedido.criado_em).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-4">
                          <Link href={`/admin/pedidos/${pedido.id}`} className="hover:underline">
                            {pedido.cliente_nome}
                          </Link>
                        </td>
                        <td className="p-4">
                          <LabelCanal canal={pedido.canal ?? (pedido.origem === "balcao" ? "balcao" : "site")} />
                        </td>
                        <td className="p-4 text-slate-500">{pedido.tipo_entrega || "-"}</td>
                        <td className="p-4 text-slate-500">
                          {ROTULOS_STATUS[pedido.status] ?? pedido.status}
                        </td>
                        <td className="p-4 font-medium">{formatarMoeda(pedido.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
