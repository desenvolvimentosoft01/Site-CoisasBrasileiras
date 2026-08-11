"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Search, X } from "lucide-react"
import { toast } from "sonner"
import { registrarAuditoria } from "@/lib/auditoria"

export type ProdutoEstoque = {
  id: string
  nome: string
  sku: string | null
  estoque: number
  estoque_minimo: number
  ativo: boolean
}

export function EstoqueConteudo({ produtosIniciais }: { produtosIniciais: ProdutoEstoque[] }) {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>(produtosIniciais)
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState<"todos" | "baixo">("todos")
  // Valores em edicao por linha (id -> texto do input), pra so gravar no "Salvar".
  const [edicoes, setEdicoes] = useState<Record<string, string>>({})
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  const emBaixa = produtos.filter((p) => p.estoque <= p.estoque_minimo).length

  async function salvar(produto: ProdutoEstoque) {
    const novo = edicoes[produto.id]
    if (novo === undefined || novo === String(produto.estoque)) return

    setSalvandoId(produto.id)
    const resposta = await fetch(`/api/admin/estoque/${produto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estoque: Number(novo) }),
    })
    setSalvandoId(null)

    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao ajustar estoque")
      return
    }

    registrarAuditoria({
      tela: "Estoque",
      acao: "edicao",
      tabela: "TAB_PRODUTO",
      registroId: produto.id,
      antes: { estoque: produto.estoque },
      depois: { estoque: Number(novo) },
    })

    setProdutos((atual) =>
      atual.map((p) => (p.id === produto.id ? { ...p, estoque: Number(novo) } : p))
    )
    setEdicoes((atual) => {
      const copia = { ...atual }
      delete copia[produto.id]
      return copia
    })
  }

  const filtrados = produtos.filter((p) => {
    const bateBusca = `${p.nome} ${p.sku || ""}`.toLowerCase().includes(busca.toLowerCase())
    const bateFiltro = filtro === "todos" || p.estoque <= p.estoque_minimo
    return bateBusca && bateFiltro
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Controle de estoque</h1>
        {emBaixa > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-600/20 px-3 py-1 text-sm text-amber-500">
            <AlertTriangle size={14} />
            {emBaixa} produto(s) com estoque baixo
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as "todos" | "baixo")}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="baixo">Estoque baixo</TabsTrigger>
          </TabsList>
        </Tabs>
        {(busca || filtro !== "todos") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setBusca("")
              setFiltro("todos")
            }}
          >
            <X size={14} className="mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhum produto encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">SKU</th>
                    <th className="p-4 font-medium">Mínimo</th>
                    <th className="p-4 font-medium">Estoque atual</th>
                    <th className="p-4 font-medium text-right">Ajustar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((produto) => {
                    const baixo = produto.estoque <= produto.estoque_minimo
                    const valorEdicao = edicoes[produto.id] ?? String(produto.estoque)
                    const alterado = valorEdicao !== String(produto.estoque)
                    return (
                      <tr key={produto.id} className="border-b border-slate-200 last:border-0">
                        <td className="p-4">
                          {produto.nome}
                          {!produto.ativo && (
                            <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">
                              inativo
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500">{produto.sku || "-"}</td>
                        <td className="p-4 text-slate-500">{produto.estoque_minimo}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 font-medium ${
                              baixo ? "text-amber-500" : ""
                            }`}
                          >
                            {baixo && <AlertTriangle size={14} />}
                            {produto.estoque}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              min={0}
                              className="w-24"
                              value={valorEdicao}
                              onChange={(e) =>
                                setEdicoes((atual) => ({ ...atual, [produto.id]: e.target.value }))
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!alterado || salvandoId === produto.id}
                              onClick={() => salvar(produto)}
                            >
                              {salvandoId === produto.id ? "..." : "Salvar"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
