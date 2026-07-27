"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { List, Plus, Trash2, PackageCheck, Ban } from "lucide-react"
import { formatarMoeda, mascaraMoeda, valorMoedaParaNumero } from "@/lib/mascaras"
import { registrarAuditoria } from "@/lib/auditoria"

export type Fornecedor = { id: string; razao_social: string }
export type ProdutoSelecionavel = { id: string; nome: string; sku: string | null; custo: string; estoque: number }

export type Compra = {
  id: string
  numero_nota: string | null
  status: "pendente" | "recebida" | "cancelada"
  valor_frete: string
  data_compra: string
  criado_em: string
  fornecedor_nome: string
  valor_itens: string
}

type ItemCarrinho = { produtoId: string; nome: string; quantidade: number; custoUnitario: string }

const STATUS_ESTILO: Record<Compra["status"], string> = {
  pendente: "bg-amber-500/20 text-amber-500",
  recebida: "bg-emerald-600/20 text-emerald-400",
  cancelada: "bg-slate-200 text-slate-500",
}

const STATUS_LABEL: Record<Compra["status"], string> = {
  pendente: "Pendente",
  recebida: "Recebida",
  cancelada: "Cancelada",
}

export function ComprasConteudo({
  comprasIniciais,
  fornecedores,
  produtos,
}: {
  comprasIniciais: Compra[]
  fornecedores: Fornecedor[]
  produtos: ProdutoSelecionavel[]
}) {
  const [compras, setCompras] = useState<Compra[]>(comprasIniciais)
  const [aba, setAba] = useState("lista")

  const [fornecedorId, setFornecedorId] = useState("")
  const [numeroNota, setNumeroNota] = useState("")
  const [dataCompra, setDataCompra] = useState(() => new Date().toISOString().slice(0, 10))
  const [valorFrete, setValorFrete] = useState("")
  const [observacao, setObservacao] = useState("")
  const [itens, setItens] = useState<ItemCarrinho[]>([])

  const [produtoId, setProdutoId] = useState("")
  const [quantidade, setQuantidade] = useState("1")
  const [custoUnitario, setCustoUnitario] = useState("")

  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  async function recarregar() {
    const resposta = await fetch("/api/admin/compras")
    setCompras(await resposta.json())
  }

  function abrirNova() {
    setFornecedorId("")
    setNumeroNota("")
    setDataCompra(new Date().toISOString().slice(0, 10))
    setValorFrete("")
    setObservacao("")
    setItens([])
    setProdutoId("")
    setQuantidade("1")
    setCustoUnitario("")
    setErro("")
    setAba("formulario")
  }

  function adicionarItem() {
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) return
    const qtd = Number(quantidade)
    if (!(qtd > 0)) return

    setItens((atual) => [
      ...atual,
      {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: qtd,
        custoUnitario: custoUnitario || mascaraMoeda(String(Math.round(Number(produto.custo) * 100))),
      },
    ])
    setProdutoId("")
    setQuantidade("1")
    setCustoUnitario("")
  }

  function removerItem(produtoId: string) {
    setItens((atual) => atual.filter((i) => i.produtoId !== produtoId))
  }

  const totalItens = itens.reduce((soma, i) => soma + i.quantidade * valorMoedaParaNumero(i.custoUnitario), 0)
  const totalCompra = totalItens + valorMoedaParaNumero(valorFrete || "0,00")

  async function salvar() {
    setErro("")

    if (!fornecedorId) {
      setErro("Selecione um fornecedor")
      return
    }
    if (itens.length === 0) {
      setErro("Adicione pelo menos um item")
      return
    }

    setSalvando(true)

    const resposta = await fetch("/api/admin/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fornecedorId,
        numeroNota: numeroNota || null,
        valorFrete: valorMoedaParaNumero(valorFrete || "0,00"),
        dataCompra,
        observacao: observacao || null,
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          custoUnitario: valorMoedaParaNumero(i.custoUnitario),
        })),
      }),
    })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    const salva = await resposta.json()
    registrarAuditoria({
      tela: "Compras",
      acao: "cadastro",
      tabela: "TAB_COMPRA",
      registroId: salva.id,
      depois: { fornecedor_id: fornecedorId, itens: itens.length },
    })

    setAba("lista")
    recarregar()
  }

  async function receber(compra: Compra) {
    if (!confirm(`Confirmar o recebimento da compra de "${compra.fornecedor_nome}"? Isso vai dar alta no estoque, atualizar o custo dos produtos e gerar uma conta a pagar.`)) return

    setProcessandoId(compra.id)
    const resposta = await fetch(`/api/admin/compras/${compra.id}/receber`, { method: "POST" })
    setProcessandoId(null)

    if (!resposta.ok) {
      const dados = await resposta.json()
      alert(dados.erro || "Erro ao receber compra")
      return
    }

    registrarAuditoria({
      tela: "Compras",
      acao: "edicao",
      tabela: "TAB_COMPRA",
      registroId: compra.id,
      antes: { status: "pendente" },
      depois: { status: "recebida" },
    })
    recarregar()
  }

  async function cancelar(compra: Compra) {
    if (!confirm(`Cancelar a compra de "${compra.fornecedor_nome}"?`)) return

    setProcessandoId(compra.id)
    const resposta = await fetch(`/api/admin/compras/${compra.id}/cancelar`, { method: "POST" })
    setProcessandoId(null)

    if (!resposta.ok) {
      const dados = await resposta.json()
      alert(dados.erro || "Erro ao cancelar compra")
      return
    }

    registrarAuditoria({
      tela: "Compras",
      acao: "edicao",
      tabela: "TAB_COMPRA",
      registroId: compra.id,
      antes: { status: "pendente" },
      depois: { status: "cancelada" },
    })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Compras</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lista">
              <List size={14} className="mr-1.5" />
              Grade
            </TabsTrigger>
            <TabsTrigger value="formulario">
              <Plus size={14} className="mr-1.5" />
              Cadastro
            </TabsTrigger>
          </TabsList>
          {aba === "lista" && (
            <Button onClick={abrirNova}>
              <Plus size={16} className="mr-2" />
              Nova compra
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {compras.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma compra cadastrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Fornecedor</th>
                        <th className="p-4 font-medium">NF</th>
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compras.map((compra) => (
                        <tr key={compra.id} className="border-b border-slate-200 last:border-0">
                          <td className="p-4 font-medium">{compra.fornecedor_nome}</td>
                          <td className="p-4 text-slate-500">{compra.numero_nota || "-"}</td>
                          <td className="p-4 text-slate-500">
                            {new Date(compra.data_compra).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-4">
                            {formatarMoeda(Number(compra.valor_itens) + Number(compra.valor_frete))}
                          </td>
                          <td className="p-4">
                            <span className={`rounded-full px-2 py-1 text-xs ${STATUS_ESTILO[compra.status]}`}>
                              {STATUS_LABEL[compra.status]}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {compra.status === "pendente" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  disabled={processandoId === compra.id}
                                  onClick={() => receber(compra)}
                                  title="Receber (da alta no estoque e atualiza custo)"
                                >
                                  <PackageCheck size={16} className="text-emerald-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  disabled={processandoId === compra.id}
                                  onClick={() => cancelar(compra)}
                                  title="Cancelar"
                                >
                                  <Ban size={16} className="text-red-500" />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Nova compra</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAba("lista")}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar compra"}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <select
                  value={fornecedorId}
                  onChange={(e) => setFornecedorId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Selecione...</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.razao_social}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Numero da nota (opcional)</Label>
                <Input value={numeroNota} onChange={(e) => setNumeroNota(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data da compra</Label>
                <Input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor do frete (R$)</Label>
                <Input
                  inputMode="numeric"
                  value={valorFrete}
                  onChange={(e) => setValorFrete(mascaraMoeda(e.target.value))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Observacao</Label>
                <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-medium">Itens da compra</p>

              <div className="grid gap-3 sm:grid-cols-[1fr_100px_140px_auto]">
                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Selecione o produto...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} {p.sku ? `(${p.sku})` : ""} - estoque atual: {p.estoque}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="Qtd"
                />
                <Input
                  inputMode="numeric"
                  value={custoUnitario}
                  onChange={(e) => setCustoUnitario(mascaraMoeda(e.target.value))}
                  placeholder="Custo unit. (R$)"
                />
                <Button type="button" variant="outline" onClick={adicionarItem} disabled={!produtoId}>
                  Adicionar
                </Button>
              </div>

              {itens.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-slate-500">
                        <th className="p-3 font-medium">Produto</th>
                        <th className="p-3 font-medium">Qtd</th>
                        <th className="p-3 font-medium">Custo unit.</th>
                        <th className="p-3 font-medium">Subtotal</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item) => (
                        <tr key={item.produtoId} className="border-b border-border last:border-0">
                          <td className="p-3">{item.nome}</td>
                          <td className="p-3">{item.quantidade}</td>
                          <td className="p-3">{item.custoUnitario}</td>
                          <td className="p-3">
                            {formatarMoeda(item.quantidade * valorMoedaParaNumero(item.custoUnitario))}
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="icon-lg" onClick={() => removerItem(item.produtoId)}>
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-6 border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">Itens: {formatarMoeda(totalItens)}</span>
                <span className="text-muted-foreground">
                  Frete: {formatarMoeda(valorMoedaParaNumero(valorFrete || "0,00"))}
                </span>
                <span className="font-semibold">Total: {formatarMoeda(totalCompra)}</span>
              </div>

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
