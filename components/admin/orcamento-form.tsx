"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, User, X } from "lucide-react"
import { formatarMoeda, mascaraTelefone } from "@/lib/mascaras"

type Cliente = { id: string; nome: string; email: string | null; telefone: string | null }
type ProdutoDisponivel = { id: string; nome: string; preco: string; preco_promocional: string | null }

type ItemForm = {
  produtoId: string | null
  descricao: string
  quantidade: string
  valorUnitario: string
}

export type OrcamentoExistente = {
  id: string
  titulo: string | null
  cliente_id: string | null
  cliente_nome: string
  cliente_telefone: string | null
  condicoes: string | null
  desconto: string
  itens: { produto_id: string | null; descricao: string; quantidade: string; valor_unitario: string }[]
}

export function OrcamentoForm({
  orcamento,
  onSalvo,
  onCancelar,
}: {
  orcamento?: OrcamentoExistente
  onSalvo: () => void
  onCancelar: () => void
}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoDisponivel[]>([])

  const [titulo, setTitulo] = useState(orcamento?.titulo || "")
  const [clienteId, setClienteId] = useState<string | null>(orcamento?.cliente_id || null)
  const [clienteNome, setClienteNome] = useState(orcamento?.cliente_nome || "")
  const [clienteTelefone, setClienteTelefone] = useState(
    orcamento?.cliente_telefone ? mascaraTelefone(orcamento.cliente_telefone) : ""
  )
  const [buscaCliente, setBuscaCliente] = useState("")
  const [condicoes, setCondicoes] = useState(orcamento?.condicoes || "")
  const [desconto, setDesconto] = useState(orcamento?.desconto || "0")
  const [itens, setItens] = useState<ItemForm[]>(
    orcamento?.itens.map((i) => ({
      produtoId: i.produto_id,
      descricao: i.descricao,
      quantidade: i.quantidade,
      valorUnitario: i.valor_unitario,
    })) || [{ produtoId: null, descricao: "", quantidade: "1", valorUnitario: "" }]
  )
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch("/api/admin/clientes")
      .then((r) => r.json())
      .then((dados) => setClientes(Array.isArray(dados) ? dados : []))
    fetch("/api/admin/venda-balcao/produtos")
      .then((r) => r.json())
      .then((dados) => setProdutosDisponiveis(Array.isArray(dados) ? dados : []))
  }, [])

  const clientesFiltrados = buscaCliente
    ? clientes.filter((c) => `${c.nome} ${c.email || ""}`.toLowerCase().includes(buscaCliente.toLowerCase()))
    : []

  function selecionarCliente(cliente: Cliente) {
    setClienteId(cliente.id)
    setClienteNome(cliente.nome)
    setClienteTelefone(cliente.telefone || "")
    setBuscaCliente("")
  }

  function adicionarItem() {
    setItens((atual) => [...atual, { produtoId: null, descricao: "", quantidade: "1", valorUnitario: "" }])
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
    setItens((atual) =>
      atual.map((item, i) =>
        i === indice
          ? {
              ...item,
              produtoId,
              descricao: produto.nome,
              valorUnitario: String(Number(produto.preco_promocional || produto.preco)),
            }
          : item
      )
    )
  }

  const subtotal = itens.reduce(
    (soma, item) => soma + (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0),
    0
  )
  const total = Math.max(0, subtotal - (Number(desconto) || 0))

  async function salvar() {
    setErro("")

    if (!clienteNome.trim()) {
      setErro("Nome do cliente e obrigatorio")
      return
    }
    const itensValidos = itens.filter((i) => i.descricao.trim() && Number(i.quantidade) > 0)
    if (itensValidos.length === 0) {
      setErro("Adicione pelo menos um item valido")
      return
    }

    setSalvando(true)

    const corpo = {
      titulo: titulo || null,
      clienteId,
      clienteNome,
      clienteTelefone: clienteTelefone.replace(/\D/g, "") || null,
      condicoes: condicoes || null,
      desconto: Number(desconto) || 0,
      itens: itensValidos.map((i) => ({
        produtoId: i.produtoId,
        descricao: i.descricao,
        quantidade: Number(i.quantidade),
        valorUnitario: Number(i.valorUnitario) || 0,
      })),
    }

    const url = orcamento ? `/api/admin/orcamentos/${orcamento.id}` : "/api/admin/orcamentos"
    const method = orcamento ? "PUT" : "POST"

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
    setTitulo(orcamento?.titulo || "")
    setClienteId(orcamento?.cliente_id || null)
    setClienteNome(orcamento?.cliente_nome || "")
    setClienteTelefone(orcamento?.cliente_telefone ? mascaraTelefone(orcamento.cliente_telefone) : "")
    setBuscaCliente("")
    setCondicoes(orcamento?.condicoes || "")
    setDesconto(orcamento?.desconto || "0")
    setItens(
      orcamento?.itens.map((i) => ({
        produtoId: i.produto_id,
        descricao: i.descricao,
        quantidade: i.quantidade,
        valorUnitario: i.valor_unitario,
      })) || [{ produtoId: null, descricao: "", quantidade: "1", valorUnitario: "" }]
    )
    setErro("")
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {orcamento ? `Editando orcamento #${orcamento.id.slice(0, 8)}` : "Novo orcamento"}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={limpar}>
            Limpar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Itens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {itens.map((item, indice) => (
              <div key={indice} className="grid grid-cols-12 gap-2 rounded-md border border-border p-3">
                <div className="col-span-12 sm:col-span-5">
                  <Label className="text-xs">Produto (opcional) ou descricao</Label>
                  <select
                    value={item.produtoId || ""}
                    onChange={(e) => e.target.value && selecionarProdutoNoItem(indice, e.target.value)}
                    className="mb-1 w-full rounded-md border border-slate-300 bg-slate-100 p-2 text-sm"
                  >
                    <option value="">Item avulso (servico, sem produto)</option>
                    {produtosDisponiveis.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={item.descricao}
                    onChange={(e) => atualizarItem(indice, "descricao", e.target.value)}
                    placeholder="Descricao do item"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Label className="text-xs">Quantidade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(indice, "quantidade", e.target.value)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Label className="text-xs">Valor unit. (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.valorUnitario}
                    onChange={(e) => atualizarItem(indice, "valorUnitario", e.target.value)}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Label className="text-xs">Subtotal</Label>
                  <p className="pt-2 text-sm font-medium">
                    {formatarMoeda(String((Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0)))}
                  </p>
                </div>
                <div className="col-span-1 flex items-end justify-end">
                  <Button variant="ghost" size="icon" onClick={() => removerItem(indice)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={adicionarItem}>
              <Plus size={14} className="mr-1.5" />
              Adicionar item
            </Button>

            <div className="space-y-2 border-t border-border pt-4">
              <Label>Condicoes (opcional)</Label>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-transparent p-3 text-sm"
                value={condicoes}
                onChange={(e) => setCondicoes(e.target.value)}
                placeholder="Ex: validade de 15 dias, entrada de 50% para iniciar a producao..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Titulo (opcional)</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Kit de porcelanas" />
              </div>

              {clienteId ? (
                <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                  <span>{clienteNome}</span>
                  <button
                    onClick={() => {
                      setClienteId(null)
                      setClienteNome("")
                      setClienteTelefone("")
                    }}
                  >
                    <X size={14} className="text-slate-500" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <User size={12} /> Buscar cliente cadastrado
                  </Label>
                  <Input
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    placeholder="Nome ou email..."
                  />
                  {clientesFiltrados.length > 0 && (
                    <div className="max-h-32 overflow-y-auto rounded-md border border-input">
                      {clientesFiltrados.slice(0, 6).map((cliente) => (
                        <button
                          key={cliente.id}
                          onClick={() => selecionarCliente(cliente)}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          {cliente.nome}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-400">Ou preencha direto, sem cadastro:</p>
                  <Input
                    placeholder="Nome do cliente"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                  />
                  <Input
                    placeholder="Telefone"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(mascaraTelefone(e.target.value))}
                    inputMode="tel"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Totais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatarMoeda(String(subtotal))}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Desconto (R$)</Label>
                <Input type="number" step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-lg font-semibold">
                <span>Total</span>
                <span>{formatarMoeda(String(total))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
