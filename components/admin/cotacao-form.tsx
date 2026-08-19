"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { rotuloFornecedor } from "@/lib/fornecedor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Save, Eraser, X } from "lucide-react"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"

export type Fornecedor = {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj_cpf: string | null
  email: string | null
}
export type ProdutoDisponivel = { id: string; nome: string; sku: string | null }

type ItemForm = { produtoId: string | null; descricao: string; quantidade: string }

export type CotacaoExistente = {
  id: string
  numero: number
  fornecedor_id: string
  observacao: string | null
  status: "aberto" | "enviado" | "respondida" | "aceita" | "recusada" | "cancelada"
  itens: {
    produto_id: string | null
    descricao: string
    quantidade_solicitada: string
    quantidade_cotada: string | null
    valor_unitario_cotado: string | null
  }[]
}

export function CotacaoForm({
  cotacao,
  fornecedores,
  produtosDisponiveis,
  onSalvo,
  onCancelar,
}: {
  cotacao?: CotacaoExistente
  fornecedores: Fornecedor[]
  produtosDisponiveis: ProdutoDisponivel[]
  onSalvo: () => void
  onCancelar: () => void
}) {
  const [fornecedorId, setFornecedorId] = useState(cotacao?.fornecedor_id || "")
  const [observacao, setObservacao] = useState(cotacao?.observacao || "")
  const [itens, setItens] = useState<ItemForm[]>(
    cotacao?.itens.map((i) => ({
      produtoId: i.produto_id,
      descricao: i.descricao,
      quantidade: i.quantidade_solicitada,
    })) || [{ produtoId: null, descricao: "", quantidade: "1" }]
  )
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  function adicionarItem() {
    setItens((atual) => [...atual, { produtoId: null, descricao: "", quantidade: "1" }])
  }

  function removerItem(indice: number) {
    setItens((atual) => atual.filter((_, i) => i !== indice))
  }

  function atualizarItem(indice: number, campo: keyof ItemForm, valor: string | null) {
    setItens((atual) => atual.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)))
  }

  function selecionarProdutoNoItem(indice: number, produtoId: string) {
    const produto = produtosDisponiveis.find((p) => p.id === produtoId)
    if (!produto) return
    setItens((atual) => atual.map((item, i) => (i === indice ? { ...item, produtoId, descricao: produto.nome } : item)))
  }

  async function salvar() {
    setErro("")

    if (!fornecedorId) {
      setErro("Selecione um fornecedor")
      return
    }
    const itensValidos = itens.filter((i) => i.descricao.trim() && Number(i.quantidade) > 0)
    if (itensValidos.length === 0) {
      setErro("Adicione pelo menos um item válido")
      return
    }

    setSalvando(true)

    const corpo = {
      fornecedorId,
      observacao: observacao || null,
      itens: itensValidos.map((i) => ({
        produtoId: i.produtoId,
        descricao: i.descricao,
        quantidade: Number(i.quantidade),
      })),
    }

    const url = cotacao ? `/api/admin/cotacoes/${cotacao.id}` : "/api/admin/cotacoes"
    const method = cotacao ? "PUT" : "POST"

    const resposta = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    onSalvo()
  }

  function limpar() {
    setFornecedorId(cotacao?.fornecedor_id || "")
    setObservacao(cotacao?.observacao || "")
    setItens(
      cotacao?.itens.map((i) => ({
        produtoId: i.produto_id,
        descricao: i.descricao,
        quantidade: i.quantidade_solicitada,
      })) || [{ produtoId: null, descricao: "", quantidade: "1" }]
    )
    setErro("")
  }

  return (
    <div className="w-full space-y-6">
      <p className="px-1 text-sm font-medium text-muted-foreground">
        {cotacao ? `Editando cotação #${String(cotacao.numero).padStart(4, "0")}` : "Nova cotação"}
      </p>
      <div className="overflow-hidden rounded-lg border border-border">
        <BarraFerramentas
          botoes={[
            { label: "Gravar", icon: Save, onClick: salvar, variante: "success", disabled: salvando },
            { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
            { label: "Cancelar", icon: X, onClick: onCancelar, variante: "danger" },
          ]}
        />
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Itens (sem preço - o fornecedor cota)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {itens.map((item, indice) => (
              <div key={indice} className="grid grid-cols-12 gap-2 rounded-md border border-border p-3">
                <div className="col-span-12 sm:col-span-7">
                  <Label className="text-xs">Produto (opcional) ou descrição</Label>
                  <select
                    value={item.produtoId || ""}
                    onChange={(e) => e.target.value && selecionarProdutoNoItem(indice, e.target.value)}
                    className="mb-1 w-full rounded-md border border-slate-300 bg-slate-100 p-2 text-sm"
                  >
                    <option value="">Selecione um produto...</option>
                    {produtosDisponiveis.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} {p.sku ? `(${p.sku})` : ""}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={item.descricao}
                    onChange={(e) => atualizarItem(indice, "descricao", e.target.value)}
                    placeholder="Descrição do item"
                  />
                </div>
                <div className="col-span-8 sm:col-span-4">
                  <Label className="text-xs">Quantidade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(indice, "quantidade", e.target.value)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-1 flex items-end justify-end">
                  <Button variant="ghost" size="icon" onClick={() => removerItem(indice)}>
                    <span className="text-base leading-none">🗑️</span>
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={adicionarItem}>
              <Plus size={14} className="mr-1.5" />
              Adicionar item
            </Button>

            <div className="space-y-2 border-t border-border pt-4">
              <Label>Observação (opcional)</Label>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-transparent p-3 text-sm"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: prazo de entrega desejado, condições de pagamento..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Selecione...</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {rotuloFornecedor(f)}
                </option>
              ))}
            </select>
            {fornecedorId && !fornecedores.find((f) => f.id === fornecedorId)?.email && (
              <p className="text-xs text-amber-500">
                Esse fornecedor não tem e-mail cadastrado - complete o cadastro pra poder enviar.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
