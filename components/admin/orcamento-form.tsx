"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, User, X, Save, Eraser, RefreshCw } from "lucide-react"
import { formatarMoeda, mascaraTelefone } from "@/lib/mascaras"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"

type Cliente = { id: string; nome: string; email: string | null; telefone: string | null }
type ProdutoDisponivel = {
  id: string
  nome: string
  preco: string
  preco_promocional: string | null
  marca: "colorido" | "branco"
}

type ItemForm = {
  produtoId: string | null
  descricao: string
  quantidade: string
  valorUnitario: string
}

export type OrcamentoExistente = {
  id: string
  numero: number
  titulo: string | null
  cliente_id: string | null
  cliente_nome: string
  cliente_telefone: string | null
  cliente_email: string | null
  condicoes: string | null
  desconto: string
  status: "aberto" | "aprovado" | "recusado" | "convertido"
  enviado_email_em: string | null
  respondido_em: string | null
  canal_resposta: "email" | "whatsapp" | null
  observacao_cliente: string | null
  marca: "colorido" | "branco"
  itens: { produto_id: string | null; descricao: string; quantidade: string; valor_unitario: string }[]
}

const STATUS_ROTULO: Record<OrcamentoExistente["status"], string> = {
  aberto: "Aguardando resposta do cliente",
  aprovado: "Aprovado pelo cliente",
  recusado: "Recusado pelo cliente",
  convertido: "Convertido em venda",
}

const STATUS_COR: Record<OrcamentoExistente["status"], string> = {
  aberto: "bg-blue-600/10 text-blue-600",
  aprovado: "bg-emerald-600/10 text-emerald-600",
  recusado: "bg-red-600/10 text-red-600",
  convertido: "bg-slate-500/10 text-slate-500",
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
  const [clienteEmail, setClienteEmail] = useState(orcamento?.cliente_email || "")
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
  const [marca, setMarca] = useState<"colorido" | "branco">(orcamento?.marca ?? "colorido")
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [statusAtual, setStatusAtual] = useState(orcamento)
  const [atualizandoStatus, setAtualizandoStatus] = useState(false)

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
    setClienteEmail(cliente.email || "")
    setBuscaCliente("")
  }

  // Produtos sao por marca - trocar a marca do orcamento invalida itens que
  // ja apontam pra um produto de catalogo da outra marca (mesmo padrao do
  // produto-form.tsx com categorias).
  function trocarMarca(novaMarca: "colorido" | "branco") {
    setMarca(novaMarca)
    setItens((atual) =>
      atual.map((item) =>
        item.produtoId && produtosDisponiveis.find((p) => p.id === item.produtoId)?.marca !== novaMarca
          ? { ...item, produtoId: null }
          : item
      )
    )
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
      setErro("Nome do cliente é obrigatório")
      return
    }
    const itensValidos = itens.filter((i) => i.descricao.trim() && Number(i.quantidade) > 0)
    if (itensValidos.length === 0) {
      setErro("Adicione pelo menos um item válido")
      return
    }

    setSalvando(true)

    const corpo = {
      titulo: titulo || null,
      clienteId,
      clienteNome,
      clienteTelefone: clienteTelefone.replace(/\D/g, "") || null,
      clienteEmail: clienteEmail.trim() || null,
      condicoes: condicoes || null,
      desconto: Number(desconto) || 0,
      marca,
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

  async function atualizarStatus() {
    if (!orcamento) return
    setAtualizandoStatus(true)
    const resposta = await fetch(`/api/admin/orcamentos/${orcamento.id}`)
    setAtualizandoStatus(false)
    if (!resposta.ok) return
    setStatusAtual(await resposta.json())
  }

  function limpar() {
    setTitulo(orcamento?.titulo || "")
    setClienteId(orcamento?.cliente_id || null)
    setClienteNome(orcamento?.cliente_nome || "")
    setClienteTelefone(orcamento?.cliente_telefone ? mascaraTelefone(orcamento.cliente_telefone) : "")
    setClienteEmail(orcamento?.cliente_email || "")
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
    setMarca(orcamento?.marca ?? "colorido")
    setErro("")
  }

  return (
    <div className="w-full space-y-6">
      <p className="px-1 text-sm font-medium text-muted-foreground">
        {orcamento ? `Editando orçamento #${orcamento.id.slice(0, 8)}` : "Novo orçamento"}
      </p>
      <div className="overflow-hidden rounded-lg border border-border">
        <BarraFerramentas
          botoes={[
            { label: "Gravar", icon: Save, onClick: salvar, variante: "success", disabled: salvando },
            { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
            ...(orcamento
              ? [
                  {
                    label: atualizandoStatus ? "Atualizando..." : "Atualizar status",
                    icon: RefreshCw,
                    onClick: atualizarStatus,
                    disabled: atualizandoStatus,
                  },
                ]
              : []),
            { label: "Cancelar", icon: X, onClick: onCancelar, variante: "danger" },
          ]}
          extra={
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Site:</span>
              {(["colorido", "branco"] as const).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => trocarMarca(opcao)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    marca === opcao
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-slate-300 bg-white text-slate-500 hover:border-primary/50"
                  }`}
                >
                  {opcao === "branco" ? "⚪ Porcelanas Brancas" : "🎨 Coisas Brasileiras"}
                </button>
              ))}
            </div>
          }
        />
      </div>

      {statusAtual && (
        <div className={`flex flex-wrap items-center gap-2 rounded-md px-3 py-2 text-sm ${STATUS_COR[statusAtual.status]}`}>
          <span className="font-medium">{STATUS_ROTULO[statusAtual.status]}</span>
          {statusAtual.enviado_email_em && (
            <span className="text-xs opacity-80">
              · E-mail enviado em {new Date(statusAtual.enviado_email_em).toLocaleString("pt-BR")}
            </span>
          )}
          {statusAtual.respondido_em && (
            <span className="text-xs opacity-80">
              · Respondido via {statusAtual.canal_resposta === "whatsapp" ? "WhatsApp" : "e-mail"} em{" "}
              {new Date(statusAtual.respondido_em).toLocaleString("pt-BR")}
            </span>
          )}
          {statusAtual.observacao_cliente && (
            <span className="w-full text-xs opacity-80">Observação do cliente: &ldquo;{statusAtual.observacao_cliente}&rdquo;</span>
          )}
        </div>
      )}

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
                  <Label className="text-xs">Produto (opcional) ou descrição</Label>
                  <select
                    value={item.produtoId || ""}
                    onChange={(e) => e.target.value && selecionarProdutoNoItem(indice, e.target.value)}
                    className="mb-1 w-full rounded-md border border-slate-300 bg-slate-100 p-2 text-sm"
                  >
                    <option value="">Selecione um produto...</option>
                    {produtosDisponiveis
                      .filter((p) => p.marca === marca)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                  </select>
                  <Input
                    value={item.descricao}
                    onChange={(e) => atualizarItem(indice, "descricao", e.target.value)}
                    placeholder="Descrição do item"
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
              <Label>Condições (opcional)</Label>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-transparent p-3 text-sm"
                value={condicoes}
                onChange={(e) => setCondicoes(e.target.value)}
                placeholder="Ex: validade de 15 dias, entrada de 50% para iniciar a produção..."
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
                <Label>Título (opcional)</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Kit de porcelanas" />
              </div>

              {clienteId ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                    <span>{clienteNome}</span>
                    <button
                      onClick={() => {
                        setClienteId(null)
                        setClienteNome("")
                        setClienteTelefone("")
                        setClienteEmail("")
                      }}
                    >
                      <X size={14} className="text-slate-500" />
                    </button>
                  </div>
                  <Input
                    placeholder="E-mail (pra enviar o orçamento)"
                    type="email"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                  />
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
