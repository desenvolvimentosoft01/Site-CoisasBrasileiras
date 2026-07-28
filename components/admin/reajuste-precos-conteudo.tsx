"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { registrarAuditoria } from "@/lib/auditoria"

type Produto = {
  id: string
  nome: string
  sku: string | null
  preco: string
  preco_promocional: string | null
  custo: string | null
  ativo: boolean
  categoria_ids: string[]
}

type Categoria = { id: string; nome: string }

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// Arredonda pro centavo mais proximo - reajuste percentual gera casas
// decimais quebradas (ex: 10% de R$ 19,99 = R$ 21,989), e preco no banco e
// NUMERIC(10,2).
function arredondar(valor: number) {
  return Math.round(valor * 100) / 100
}

export function ReajustePrecosConteudo({
  produtosIniciais,
  categorias,
}: {
  produtosIniciais: Produto[]
  categorias: Categoria[]
}) {
  const [produtos, setProdutos] = useState(produtosIniciais)
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas")
  const [busca, setBusca] = useState("")
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [tipo, setTipo] = useState<"percentual" | "fixo">("percentual")
  const [direcao, setDirecao] = useState<"aumento" | "reducao">("aumento")
  const [valor, setValor] = useState("")
  const [aplicarNoPromocional, setAplicarNoPromocional] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      if (categoriaFiltro !== "todas" && !p.categoria_ids.includes(categoriaFiltro)) return false
      if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase()) && !(p.sku ?? "").toLowerCase().includes(busca.toLowerCase())) {
        return false
      }
      return true
    })
  }, [produtos, categoriaFiltro, busca])

  const valorNumerico = Number(valor.replace(",", ".")) || 0

  function calcularNovoPreco(precoAtual: number) {
    if (!valorNumerico) return precoAtual
    if (tipo === "percentual") {
      const fator = direcao === "aumento" ? 1 + valorNumerico / 100 : 1 - valorNumerico / 100
      return Math.max(0, arredondar(precoAtual * fator))
    }
    const delta = direcao === "aumento" ? valorNumerico : -valorNumerico
    return Math.max(0, arredondar(precoAtual + delta))
  }

  function alternarSelecao(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function selecionarTodosFiltrados() {
    setSelecionados(new Set(produtosFiltrados.map((p) => p.id)))
  }

  function limparSelecao() {
    setSelecionados(new Set())
  }

  async function aplicarReajuste() {
    setErro("")
    setSucesso("")
    if (selecionados.size === 0) {
      setErro("Selecione ao menos um produto")
      return
    }
    if (!valorNumerico) {
      setErro("Informe um valor de reajuste")
      return
    }

    const itens = produtos
      .filter((p) => selecionados.has(p.id))
      .map((p) => {
        const precoNovo = calcularNovoPreco(Number(p.preco))
        const promocionalNovo =
          aplicarNoPromocional && p.preco_promocional ? calcularNovoPreco(Number(p.preco_promocional)) : p.preco_promocional ? Number(p.preco_promocional) : null
        return { id: p.id, preco: precoNovo, precoPromocional: promocionalNovo, nome: p.nome, precoAntigo: Number(p.preco) }
      })

    setSalvando(true)
    const resposta = await fetch("/api/admin/precos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens }),
    })
    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}))
      setErro(dados.erro ?? "Erro ao aplicar reajuste")
      return
    }

    for (const item of itens) {
      registrarAuditoria({
        tela: "Reajuste de precos",
        acao: "edicao",
        tabela: "TAB_PRODUTO",
        registroId: item.id,
        antes: { preco: item.precoAntigo },
        depois: { preco: item.preco },
      })
    }

    setSucesso(`${itens.length} produto(s) atualizado(s)`)
    setSelecionados(new Set())
    setValor("")

    const atualizados = await fetch("/api/admin/precos").then((r) => r.json())
    setProdutos(atualizados)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reajuste de Precos</h1>
      <p className="text-sm text-slate-500">
        Atualize o preco de varios produtos de uma vez, por percentual ou valor fixo. Confira a pre-visualizacao antes de aplicar.
      </p>

      {erro && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{erro}</p>}
      {sucesso && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-600">{sucesso}</p>}

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as "percentual" | "fixo")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentual">Percentual (%)</SelectItem>
                <SelectItem value="fixo">Valor fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Direcao</label>
            <Select value={direcao} onValueChange={(v) => setDirecao(v as "aumento" | "reducao")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aumento">Aumento</SelectItem>
                <SelectItem value="reducao">Reducao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor</label>
            <Input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={tipo === "percentual" ? "Ex: 10" : "Ex: 5,00"}
              className="w-32"
            />
          </div>

          <label className="flex items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={aplicarNoPromocional}
              onChange={(e) => setAplicarNoPromocional(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Aplicar tambem no preco promocional
          </label>

          <Button onClick={aplicarReajuste} disabled={salvando || selecionados.size === 0} className="ml-auto">
            {salvando ? "Aplicando..." : `Aplicar em ${selecionados.size} produto(s)`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-64"
          />

          <Select value={categoriaFiltro} onValueChange={(v) => setCategoriaFiltro(v || "todas")}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={selecionarTodosFiltrados}>
            Selecionar filtrados ({produtosFiltrados.length})
          </Button>
          <Button variant="outline" size="sm" onClick={limparSelecao}>
            Limpar selecao
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="p-4 font-medium"></th>
                  <th className="p-4 font-medium">Produto</th>
                  <th className="p-4 font-medium">Custo</th>
                  <th className="p-4 font-medium">Preco atual</th>
                  <th className="p-4 font-medium">Preco novo</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto) => {
                  const precoAtual = Number(produto.preco)
                  const precoNovo = selecionados.has(produto.id) ? calcularNovoPreco(precoAtual) : precoAtual
                  const mudou = selecionados.has(produto.id) && valorNumerico > 0
                  return (
                    <tr key={produto.id} className="border-b border-slate-200 last:border-0">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selecionados.has(produto.id)}
                          onChange={() => alternarSelecao(produto.id)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                      </td>
                      <td className="p-4">
                        {produto.nome}
                        {!produto.ativo && <span className="ml-2 text-xs text-slate-400">(inativo)</span>}
                      </td>
                      <td className="p-4 text-slate-500">{produto.custo ? formatarMoeda(Number(produto.custo)) : "-"}</td>
                      <td className="p-4 text-slate-500">{formatarMoeda(precoAtual)}</td>
                      <td className={`p-4 font-medium ${mudou ? "text-emerald-600" : ""}`}>{formatarMoeda(precoNovo)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
