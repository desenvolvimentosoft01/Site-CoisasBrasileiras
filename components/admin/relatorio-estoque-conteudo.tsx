"use client"

import { useMemo, useState } from "react"
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
import { AlertTriangle, Filter, Search, X } from "lucide-react"
import { BotaoImprimir } from "@/components/admin/botao-imprimir"

type Produto = {
  id: string
  nome: string
  sku: string | null
  preco: string
  preco_promocional: string | null
  estoque: number
  estoque_minimo: number
  categorias: string[]
}

const TODAS = "__todas__"

export function RelatorioEstoqueConteudo({
  produtosIniciais,
  categorias,
}: {
  produtosIniciais: Produto[]
  categorias: { id: string; nome: string }[]
}) {
  const [busca, setBusca] = useState("")
  const [categoria, setCategoria] = useState(TODAS)
  const [somenteAlerta, setSomenteAlerta] = useState(false)

  const produtosFiltrados = useMemo(() => {
    return produtosIniciais.filter((p) => {
      if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (categoria !== TODAS && !p.categorias.includes(categoria)) return false
      if (somenteAlerta && p.estoque > p.estoque_minimo) return false
      return true
    })
  }, [produtosIniciais, busca, categoria, somenteAlerta])

  const valorEmEstoque = produtosFiltrados.reduce(
    (soma, p) => soma + Number(p.preco_promocional ?? p.preco) * p.estoque,
    0
  )
  const qtdAbaixoMinimo = produtosFiltrados.filter((p) => p.estoque <= p.estoque_minimo).length

  function limpar() {
    setBusca("")
    setCategoria(TODAS)
    setSomenteAlerta(false)
  }

  const filtrosAtivos = busca !== "" || categoria !== TODAS || somenteAlerta

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Relatorio de Estoque</h1>
          <p className="text-sm text-muted-foreground">Posicao atual do estoque, ao valor de venda.</p>
        </div>
        <BotaoImprimir
          descricaoPeriodo="Posicao atual do estoque - nao ha filtro de periodo, e uma foto de agora."
          campos={[
            { chave: "resumo", rotulo: "Resumo de totais" },
            { chave: "lista", rotulo: "Lista de produtos" },
          ]}
          onCamposOcultos={(camposOcultos) => {
            for (const [secao, oculto] of Object.entries(camposOcultos)) {
              document.querySelectorAll<HTMLElement>(`[data-print-section="${secao}"]`).forEach((el) => {
                el.style.display = oculto ? "none" : ""
              })
            }
            setTimeout(() => {
              document.querySelectorAll<HTMLElement>("[data-print-section]").forEach((el) => {
                el.style.display = ""
              })
            }, 1500)
          }}
        />
      </div>

      <Card className="print:hidden">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Filter size={14} />
            Filtros
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Buscar produto</Label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome do produto..."
                  className="w-56 pl-8"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v || TODAS)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todas as categorias</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={somenteAlerta}
                onChange={(e) => setSomenteAlerta(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Somente abaixo do minimo
            </label>
            {filtrosAtivos && (
              <Button size="sm" variant="outline" onClick={limpar}>
                <X size={14} className="mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div data-print-section="resumo" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Produtos listados</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{produtosFiltrados.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Valor em estoque (venda)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{formatarMoeda(String(valorEmEstoque))}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-sm text-slate-500">
              <AlertTriangle size={14} className="text-amber-500" />
              Abaixo do minimo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-amber-500">{qtdAbaixoMinimo}</CardContent>
        </Card>
      </div>

      <Card data-print-section="lista">
        <CardContent className="p-0">
          {produtosFiltrados.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhum produto encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">Categoria</th>
                    <th className="p-4 font-medium">Estoque</th>
                    <th className="p-4 font-medium">Minimo</th>
                    <th className="p-4 font-medium">Valor unit.</th>
                    <th className="p-4 font-medium">Valor em estoque</th>
                    <th className="p-4 font-medium">Situacao</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((produto) => {
                    const precoEfetivo = Number(produto.preco_promocional ?? produto.preco)
                    const emBaixa = produto.estoque <= produto.estoque_minimo
                    return (
                      <tr key={produto.id} className="border-b border-slate-200 last:border-0">
                        <td className="p-4">{produto.nome}</td>
                        <td className="p-4 text-slate-500">{produto.categorias.join(", ") || "-"}</td>
                        <td className="p-4">{produto.estoque}</td>
                        <td className="p-4 text-slate-500">{produto.estoque_minimo}</td>
                        <td className="p-4">{formatarMoeda(String(precoEfetivo))}</td>
                        <td className="p-4">{formatarMoeda(String(precoEfetivo * produto.estoque))}</td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              emBaixa
                                ? "bg-amber-600/20 text-amber-400"
                                : "bg-emerald-600/20 text-emerald-400"
                            }`}
                          >
                            {emBaixa ? "Baixo" : "OK"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300 font-semibold">
                    <td className="p-4" colSpan={5}>
                      Total
                    </td>
                    <td className="p-4">{formatarMoeda(String(valorEmEstoque))}</td>
                    <td className="p-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
