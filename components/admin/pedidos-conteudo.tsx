"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LabelCanal } from "@/components/admin/label-canal"
import { CANAL_LABEL, type CanalPedido } from "@/lib/canal-pedido"
import { statusExibicao } from "@/lib/status-pedido"
import { rotuloFormaPagamento } from "@/lib/formas-pagamento"
import { RefreshCw, X, ChevronDown } from "lucide-react"
import { toast } from "sonner"

export type Pedido = {
  id: string
  status: string
  total: string
  origem: "site" | "balcao"
  canal: CanalPedido | null
  forma_pagamento: string | null
  criado_em: string
  cliente_nome: string
  marca: "colorido" | "branco"
}

function nomeSite(marca: "colorido" | "branco") {
  return marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras"
}

type PedidoPendenteMarketplace = {
  id: string
  blingPedidoId: string
  canal: string
  motivo: string
  detectadoEm: string
}

const ABAS_STATUS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aguardando_pagamento", rotulo: "Aguardando pagamento" },
  { valor: "processando_pagamento", rotulo: "Processando pagamento" },
  { valor: "pago", rotulo: "Pago" },
  { valor: "em_separacao", rotulo: "Em separação" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "entregue", rotulo: "Entregue" },
  { valor: "cancelado", rotulo: "Cancelado" },
]

export function PedidosConteudo({ pedidosIniciais }: { pedidosIniciais: Pedido[] }) {
  const router = useRouter()
  const [aba, setAba] = useState("todos")
  const [filtroSite, setFiltroSite] = useState<"todos" | "colorido" | "branco">("todos")
  const [filtroCanal, setFiltroCanal] = useState<"todos" | CanalPedido>("todos")
  const [filtroCliente, setFiltroCliente] = useState("")
  const [listaClientesAberta, setListaClientesAberta] = useState(false)
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const pedidos = pedidosIniciais

  const nomesClientes = useMemo(
    () => Array.from(new Set(pedidos.map((p) => p.cliente_nome))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [pedidos]
  )
  const sugestoesClientes = useMemo(
    () =>
      filtroCliente.trim()
        ? nomesClientes.filter((nome) => nome.toLowerCase().includes(filtroCliente.trim().toLowerCase()))
        : nomesClientes,
    [nomesClientes, filtroCliente]
  )

  const [pendentes, setPendentes] = useState<PedidoPendenteMarketplace[]>([])
  const [importando, setImportando] = useState(false)

  useEffect(() => {
    fetch("/api/admin/bling/pedidos-pendentes")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPendentes)
  }, [])

  async function importarDoMarketplace() {
    setImportando(true)
    const resposta = await fetch("/api/admin/bling/importar-pedidos", { method: "POST" })
    const dados = await resposta.json()
    setImportando(false)

    if (!resposta.ok) {
      toast.error(dados.erro || "Erro ao importar pedidos do Bling")
      return
    }

    toast.success(`${dados.importados} pedido(s) importado(s), ${dados.pendentes} pendência(s)`)
    fetch("/api/admin/bling/pedidos-pendentes")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPendentes)
    router.refresh()
  }

  async function descartarPendencia(id: string) {
    setPendentes((atual) => atual.filter((p) => p.id !== id))
    await fetch("/api/admin/bling/pedidos-pendentes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
  }

  const pedidosFiltrados = useMemo(() => {
    const inicio = filtroDataInicio ? new Date(`${filtroDataInicio}T00:00:00`) : null
    const fim = filtroDataFim ? new Date(`${filtroDataFim}T23:59:59`) : null
    const clienteBusca = filtroCliente.trim().toLowerCase()

    return pedidos.filter((p) => {
      const canalPedido = p.canal ?? (p.origem === "balcao" ? "balcao" : "site")
      const dataPedido = new Date(p.criado_em)

      return (
        (aba === "todos" || p.status === aba) &&
        (filtroSite === "todos" || p.marca === filtroSite) &&
        (filtroCanal === "todos" || canalPedido === filtroCanal) &&
        (!clienteBusca || p.cliente_nome.toLowerCase().includes(clienteBusca)) &&
        (!inicio || dataPedido >= inicio) &&
        (!fim || dataPedido <= fim)
      )
    })
  }, [pedidos, aba, filtroSite, filtroCanal, filtroCliente, filtroDataInicio, filtroDataFim])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pedido de Venda</h1>
        <Button variant="outline" size="sm" onClick={importarDoMarketplace} disabled={importando}>
          <RefreshCw size={14} className={importando ? "animate-spin" : undefined} />
          {importando ? "Importando..." : "Importar do Mercado Livre / Shopee"}
        </Button>
      </div>

      {pendentes.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium text-amber-600">
              {pendentes.length} pedido(s) de marketplace não importado(s)
            </p>
            <ul className="space-y-1.5">
              {pendentes.map((pendente) => (
                <li key={pendente.id} className="flex items-start justify-between gap-3 text-xs text-amber-700">
                  <span>
                    <strong>{pendente.canal}</strong> · pedido {pendente.blingPedidoId}: {pendente.motivo}
                  </span>
                  <button
                    type="button"
                    onClick={() => descartarPendencia(pendente.id)}
                    className="shrink-0 text-amber-500 hover:text-amber-700"
                    title="Descartar (o próximo import vai tentar de novo)"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs value={filtroSite} onValueChange={(v) => setFiltroSite(v as typeof filtroSite)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="colorido">🎨 Coisas Brasileiras</TabsTrigger>
          <TabsTrigger value="branco">⚪ Porcelanas Brancas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-start gap-3">
        <fieldset className="flex gap-3 rounded-lg border border-slate-200 p-2 pt-1">
          <legend className="px-1 text-xs font-medium text-slate-500">Período</legend>
          <div className="space-y-1">
            <label className="mb-1 block h-4 text-xs font-medium leading-4 text-slate-500">De</label>
            <Input
              type="date"
              className="w-40"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="mb-1 block h-4 text-xs font-medium leading-4 text-slate-500">Até</label>
            <Input
              type="date"
              className="w-40"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
            />
          </div>
        </fieldset>

        <div className="space-y-1">
          <label className="mb-1 block h-4 text-xs font-medium leading-4 text-slate-500">Canal</label>
          <Select value={filtroCanal} onValueChange={(v) => setFiltroCanal(v as typeof filtroCanal)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos os canais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os canais</SelectItem>
              {Object.keys(CANAL_LABEL).map((valor) => (
                <SelectItem key={valor} value={valor}>
                  <LabelCanal canal={valor as CanalPedido} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="mb-1 block h-4 text-xs font-medium leading-4 text-slate-500">Status</label>
          <Select value={aba} onValueChange={(v) => setAba(v ?? "todos")}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              {ABAS_STATUS.map((item) => (
                <SelectItem key={item.valor} value={item.valor}>
                  {item.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative space-y-1">
          <label className="mb-1 block h-4 text-xs font-medium leading-4 text-slate-500">Cliente</label>
          <div className="relative w-48">
            <Input
              className="pr-8"
              placeholder="Buscar cliente"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              onFocus={() => setListaClientesAberta(true)}
              onBlur={() => setTimeout(() => setListaClientesAberta(false), 150)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
              onClick={() => setListaClientesAberta((aberta) => !aberta)}
              tabIndex={-1}
            >
              <ChevronDown size={14} />
            </button>
            {listaClientesAberta && sugestoesClientes.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-input bg-popover shadow-md">
                {sugestoesClientes.map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setFiltroCliente(nome)
                      setListaClientesAberta(false)
                    }}
                  >
                    {nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {(aba !== "todos" || filtroCanal !== "todos" || filtroCliente || filtroDataInicio || filtroDataFim) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAba("todos")
              setFiltroCanal("todos")
              setFiltroCliente("")
              setFiltroDataInicio("")
              setFiltroDataFim("")
            }}
          >
            <X size={14} />
            Limpar filtros
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {pedidosFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  {pedidos.length === 0
                    ? "Nenhum pedido ainda. Essa tela vai preencher quando o checkout do site estiver pronto."
                    : "Nenhum pedido com esse status."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Site</th>
                        <th className="p-4 font-medium">Cliente</th>
                        <th className="p-4 font-medium">Canal</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map((pedido) => (
                        <tr
                          key={pedido.id}
                          className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-slate-100"
                        >
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4">
                              <span className="text-sm leading-none" title={nomeSite(pedido.marca)}>
                                {pedido.marca === "branco" ? "⚪" : "🎨"}
                              </span>
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="flex items-center gap-2 p-4">
                              {pedido.cliente_nome}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4">
                              <LabelCanal canal={pedido.canal ?? (pedido.origem === "balcao" ? "balcao" : "site")} />
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4 text-slate-500">
                              <span
                                className={
                                  statusExibicao(pedido.status, pedido.criado_em) === "Provavelmente abandonado"
                                    ? "text-amber-500"
                                    : undefined
                                }
                              >
                                {statusExibicao(pedido.status, pedido.criado_em)}
                              </span>
                              {pedido.forma_pagamento && (
                                <span className="ml-1 text-xs text-slate-400">
                                  · {rotuloFormaPagamento(pedido.forma_pagamento)}
                                </span>
                              )}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4">
                              {Number(pedido.total).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link
                              href={`/admin/pedidos/${pedido.id}`}
                              className="block p-4 text-slate-500"
                            >
                              {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  )
}
