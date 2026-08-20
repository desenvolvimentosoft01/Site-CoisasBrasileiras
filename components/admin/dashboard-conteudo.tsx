"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatarMoeda } from "@/lib/mascaras"
import { LabelCanal } from "@/components/admin/label-canal"
import { statusExibicao } from "@/lib/status-pedido"
import { rotuloFormaPagamento } from "@/lib/formas-pagamento"
import type { CanalPedido } from "@/lib/canal-pedido"
import { Icone, type NomeIcone } from "@/components/admin/icone"

const coresIndicador = {
  verde: "bg-emerald-50 text-emerald-600",
  azul: "bg-blue-50 text-blue-600",
  ambar: "bg-amber-50 text-amber-600",
  roxo: "bg-purple-50 text-purple-600",
  rosa: "bg-rose-50 text-rose-600",
} as const

function CardIndicador({
  titulo,
  icone,
  cor,
  children,
}: {
  titulo: string
  icone: NomeIcone
  cor: keyof typeof coresIndicador
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm text-slate-500">{titulo}</CardTitle>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${coresIndicador[cor]}`}>
          {icone}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export type Indicadores = {
  produtosAtivos: number
  pedidosHoje: number
  faturamentoMes: string
  pedidosPendentes: number
  vendasBalcaoHoje: number
  faturamentoBalcaoHoje: string
  produtosEstoqueBaixo: { id: string; nome: string; estoque: number; estoque_minimo: number }[]
  pedidosRecentes: {
    id: string
    status: string
    total: string
    origem: string
    canal: CanalPedido | null
    forma_pagamento: string | null
    criado_em: string
    cliente_nome: string
  }[]
}

function PainelIndicadores({ dados }: { dados: Indicadores }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <CardIndicador titulo="Produtos ativos" icone="produtos" cor="verde">
          <div className="text-3xl font-semibold">{dados.produtosAtivos}</div>
        </CardIndicador>
        <CardIndicador titulo="Pedidos hoje (site)" icone="pedido_venda" cor="azul">
          <div className="text-3xl font-semibold">{dados.pedidosHoje}</div>
        </CardIndicador>
        <CardIndicador titulo="Vendas balcão hoje" icone="venda_balcao" cor="roxo">
          <div className="text-3xl font-semibold">{dados.vendasBalcaoHoje}</div>
          <div className="text-xs text-slate-400">{formatarMoeda(dados.faturamentoBalcaoHoje)}</div>
        </CardIndicador>
        <CardIndicador titulo="Faturamento do mês" icone="financeiro" cor="verde">
          <div className="text-3xl font-semibold">{formatarMoeda(dados.faturamentoMes)}</div>
        </CardIndicador>
        <CardIndicador titulo="Aguardando pagamento" icone="alerta" cor="ambar">
          <div className="text-3xl font-semibold">{dados.pedidosPendentes}</div>
        </CardIndicador>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Últimos pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dados.pedidosRecentes.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum pedido ainda.</p>
            ) : (
              dados.pedidosRecentes.map((pedido) => (
                <Link
                  key={pedido.id}
                  href={`/admin/pedidos/${pedido.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{pedido.cliente_nome}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span
                        className={
                          statusExibicao(pedido.status, pedido.criado_em) === "Provavelmente abandonado"
                            ? "text-amber-500"
                            : undefined
                        }
                      >
                        {statusExibicao(pedido.status, pedido.criado_em)}
                      </span>
                      {pedido.forma_pagamento && <span>· {rotuloFormaPagamento(pedido.forma_pagamento)}</span>}
                      <LabelCanal canal={pedido.canal ?? (pedido.origem === "balcao" ? "balcao" : "site")} />
                    </div>
                  </div>
                  <span className="font-medium">{formatarMoeda(pedido.total)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
              <Icone nome="alerta" tamanho={17} />
              Estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dados.produtosEstoqueBaixo.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum produto com estoque baixo.</p>
            ) : (
              dados.produtosEstoqueBaixo.map((produto) => (
                <Link
                  key={produto.id}
                  href={`/admin/produtos/${produto.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span className="font-medium">{produto.nome}</span>
                  <span className="text-amber-500">
                    {produto.estoque} / min. {produto.estoque_minimo}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DashboardConteudo({
  todas,
  colorido,
  branco,
}: {
  todas: Indicadores
  colorido: Indicadores
  branco: Indicadores
}) {
  const [aba, setAba] = useState<"todas" | "colorido" | "branco">("todas")
  const dados = aba === "todas" ? todas : aba === "colorido" ? colorido : branco

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Visão Geral</h1>
        <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="colorido">🎨 Colorido</TabsTrigger>
            <TabsTrigger value="branco">⚪ Branco</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <PainelIndicadores dados={dados} />
    </div>
  )
}
