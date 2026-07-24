"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Minus, Trash2, ShoppingCart, Search, User, X, Package, List } from "lucide-react"
import { formatarMoeda } from "@/lib/mascaras"

export type Produto = {
  id: string
  nome: string
  preco: string
  preco_promocional: string | null
  estoque: number
  categorias: string[]
  imagem_url: string | null
}

export type Cliente = {
  id: string
  nome: string
  email: string
  telefone: string | null
}

export type TipoEntrega = {
  id: string
  nome: string
}

export type Venda = {
  id: string
  origem: "site" | "balcao"
  status: string
  total: string
  forma_pagamento: string | null
  criado_em: string
  cliente_nome: string
}

type ItemCarrinho = {
  produtoId: string
  nome: string
  preco: number
  quantidade: number
  estoqueDisponivel: number
}

const FORMAS_PAGAMENTO = [
  { valor: "dinheiro", rotulo: "Dinheiro" },
  { valor: "pix", rotulo: "Pix" },
  { valor: "cartao_credito", rotulo: "Cartao de credito" },
  { valor: "cartao_debito", rotulo: "Cartao de debito" },
]

const ROTULOS_STATUS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

function precoEfetivo(produto: Produto) {
  return Number(produto.preco_promocional || produto.preco)
}

export function VendaBalcaoConteudo({
  produtosIniciais,
  clientesIniciais,
  tiposEntregaIniciais,
  vendasIniciais,
}: {
  produtosIniciais: Produto[]
  clientesIniciais: Cliente[]
  tiposEntregaIniciais: TipoEntrega[]
  vendasIniciais: Venda[]
}) {
  const [aba, setAba] = useState("produtos")
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [busca, setBusca] = useState("")
  const [categoriaAtiva, setCategoriaAtiva] = useState("todas")
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])

  const clientes = clientesIniciais
  const tiposEntrega = tiposEntregaIniciais
  const [buscaCliente, setBuscaCliente] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [clienteNomeAvulso, setClienteNomeAvulso] = useState("")
  const [clienteTelefoneAvulso, setClienteTelefoneAvulso] = useState("")

  const [vendas, setVendas] = useState<Venda[]>(vendasIniciais)
  const [filtroOrigem, setFiltroOrigem] = useState<"todas" | "site" | "balcao">("todas")

  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [tipoEntregaId, setTipoEntregaId] = useState<string>("nenhum")
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const categorias = useMemo(() => {
    const nomes = new Set<string>()
    produtos.forEach((p) => p.categorias.forEach((c) => nomes.add(c)))
    return ["todas", ...Array.from(nomes).sort()]
  }, [produtos])

  const produtosFiltrados = produtos.filter((p) => {
    const bateCategoria = categoriaAtiva === "todas" || p.categorias.includes(categoriaAtiva)
    const bateBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
    return bateCategoria && bateBusca
  })

  const clientesFiltrados = buscaCliente
    ? clientes.filter((c) =>
        `${c.nome} ${c.email} ${c.telefone || ""}`.toLowerCase().includes(buscaCliente.toLowerCase())
      )
    : []

  const vendasFiltradas = vendas.filter((v) => filtroOrigem === "todas" || v.origem === filtroOrigem)

  function adicionarAoCarrinho(produto: Produto) {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produtoId === produto.id)
      if (existente) {
        if (existente.quantidade >= produto.estoque) return atual
        return atual.map((i) =>
          i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      }
      if (produto.estoque < 1) return atual
      return [
        ...atual,
        {
          produtoId: produto.id,
          nome: produto.nome,
          preco: precoEfetivo(produto),
          quantidade: 1,
          estoqueDisponivel: produto.estoque,
        },
      ]
    })
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((atual) =>
      atual
        .map((i) =>
          i.produtoId === produtoId
            ? { ...i, quantidade: Math.min(i.estoqueDisponivel, Math.max(1, i.quantidade + delta)) }
            : i
        )
        .filter((i) => i.quantidade > 0)
    )
  }

  function removerItem(produtoId: string) {
    setCarrinho((atual) => atual.filter((i) => i.produtoId !== produtoId))
  }

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(cliente)
    setBuscaCliente("")
    setClienteNomeAvulso("")
    setClienteTelefoneAvulso("")
  }

  const total = carrinho.reduce((soma, i) => soma + i.preco * i.quantidade, 0)

  async function finalizarVenda() {
    setErro("")
    setFinalizando(true)

    const resposta = await fetch("/api/admin/venda-balcao/finalizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itens: carrinho.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          precoUnitario: i.preco,
        })),
        formaPagamento,
        clienteId: clienteSelecionado?.id || null,
        clienteNomeAvulso: clienteSelecionado ? null : clienteNomeAvulso || null,
        clienteTelefoneAvulso: clienteSelecionado ? null : clienteTelefoneAvulso || null,
        tipoEntregaId: tipoEntregaId === "nenhum" ? null : tipoEntregaId,
      }),
    })

    setFinalizando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao finalizar a venda")
      return
    }

    setSucesso("Venda finalizada com sucesso!")
    setCarrinho([])
    setClienteSelecionado(null)
    setClienteNomeAvulso("")
    setClienteTelefoneAvulso("")
    setFormaPagamento("dinheiro")
    setTipoEntregaId("nenhum")
    setModalPagamentoAberto(false)
    // Recarrega produtos (estoque baixado) e a grade de vendas (nova venda).
    fetch("/api/admin/venda-balcao/produtos")
      .then((r) => r.json())
      .then(setProdutos)
    fetch("/api/admin/venda-balcao/vendas")
      .then((r) => r.json())
      .then(setVendas)
    setTimeout(() => setSucesso(""), 4000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Venda Balcao</h1>
        <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
          <TabsList>
            <TabsTrigger value="produtos">
              <Package size={14} className="mr-1.5" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="vendas">
              <List size={14} className="mr-1.5" />
              Vendas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {aba === "vendas" ? (
        <div className="space-y-4">
          <Tabs value={filtroOrigem} onValueChange={(v) => setFiltroOrigem(v as typeof filtroOrigem)}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="site">Site</TabsTrigger>
              <TabsTrigger value="balcao">Balcao</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardContent className="p-0">
              {vendasFiltradas.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma venda encontrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Cliente</th>
                        <th className="p-4 font-medium">Origem</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendasFiltradas.map((venda) => (
                        <tr key={venda.id} className="border-b border-slate-200 last:border-0">
                          <td className="p-4">
                            <Link href={`/admin/pedidos/${venda.id}`} className="hover:underline">
                              {venda.cliente_nome}
                            </Link>
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                venda.origem === "balcao"
                                  ? "bg-amber-600/20 text-amber-400"
                                  : "bg-blue-600/20 text-blue-400"
                              }`}
                            >
                              {venda.origem === "balcao" ? "Balcao" : "Site"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
                            {ROTULOS_STATUS[venda.status] ?? venda.status}
                          </td>
                          <td className="p-4">{formatarMoeda(venda.total)}</td>
                          <td className="p-4 text-slate-500">
                            {new Date(venda.criado_em).toLocaleString("pt-BR")}
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
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative max-w-xs flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setCategoriaAtiva(categoria)}
                  className={`rounded-full border px-3 py-1 text-sm capitalize transition-colors ${
                    categoriaAtiva === categoria
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-input text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {categoria}
                </button>
              ))}
            </div>

            {produtosFiltrados.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum produto encontrado.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {produtosFiltrados.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoque < 1}
                    className="text-left disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Card className="h-full transition-colors hover:border-primary/50">
                      <CardContent className="space-y-2 p-3">
                        <div className="flex h-20 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                          {produto.imagem_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={produto.imagem_url}
                              alt=""
                              className="h-full w-full rounded-md object-cover"
                            />
                          ) : (
                            "Sem imagem"
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm font-medium">{produto.nome}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">
                            {formatarMoeda(String(precoEfetivo(produto)))}
                          </span>
                          <span className="text-xs text-slate-400">Est: {produto.estoque}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Card className="h-fit lg:sticky lg:top-20">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} />
                <h2 className="font-semibold">Carrinho</h2>
              </div>

              {sucesso && (
                <p className="rounded-md bg-emerald-600/20 p-2 text-sm text-emerald-400">{sucesso}</p>
              )}

              {carrinho.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum item adicionado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {carrinho.map((item) => (
                    <div key={item.produtoId} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex-1">
                        <p className="line-clamp-1">{item.nome}</p>
                        <p className="text-xs text-slate-400">{formatarMoeda(String(item.preco))}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => alterarQuantidade(item.produtoId, -1)}
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="w-5 text-center">{item.quantidade}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => alterarQuantidade(item.produtoId, 1)}
                          disabled={item.quantidade >= item.estoqueDisponivel}
                        >
                          <Plus size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removerItem(item.produtoId)}
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t border-border pt-3">
                <Label className="flex items-center gap-1 text-xs">
                  <User size={12} /> Cliente (opcional)
                </Label>
                {clienteSelecionado ? (
                  <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                    <span>{clienteSelecionado.nome}</span>
                    <button onClick={() => setClienteSelecionado(null)}>
                      <X size={14} className="text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar cliente cadastrado..."
                      value={buscaCliente}
                      onChange={(e) => setBuscaCliente(e.target.value)}
                    />
                    {clientesFiltrados.length > 0 && (
                      <div className="max-h-32 overflow-y-auto rounded-md border border-input">
                        {clientesFiltrados.slice(0, 6).map((cliente) => (
                          <button
                            key={cliente.id}
                            onClick={() => selecionarCliente(cliente)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            {cliente.nome} <span className="text-xs text-slate-400">{cliente.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-400">Ou cadastro rapido, sem conta no site:</p>
                    <Input
                      placeholder="Nome"
                      value={clienteNomeAvulso}
                      onChange={(e) => setClienteNomeAvulso(e.target.value)}
                    />
                    <Input
                      placeholder="Telefone"
                      value={clienteTelefoneAvulso}
                      onChange={(e) => setClienteTelefoneAvulso(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-lg font-semibold">
                <span>Total</span>
                <span>{formatarMoeda(String(total))}</span>
              </div>

              <Button
                className="w-full"
                disabled={carrinho.length === 0}
                onClick={() => setModalPagamentoAberto(true)}
              >
                Ir para pagamento
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={modalPagamentoAberto} onOpenChange={setModalPagamentoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatarMoeda(String(total))}</span>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v || "dinheiro")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <SelectItem key={forma.valor} value={forma.valor}>
                      {forma.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tiposEntrega.length > 0 && (
              <div className="space-y-2">
                <Label>Tipo de entrega (opcional)</Label>
                <Select value={tipoEntregaId} onValueChange={(v) => setTipoEntregaId(v || "nenhum")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem entrega (venda direta no balcao)</SelectItem>
                    {tiposEntrega.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {clienteSelecionado && (
              <Badge variant="secondary">Cliente: {clienteSelecionado.nome}</Badge>
            )}
            {!clienteSelecionado && clienteNomeAvulso && (
              <Badge variant="secondary">Cliente: {clienteNomeAvulso}</Badge>
            )}

            {erro && <p className="text-sm text-red-500">{erro}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPagamentoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={finalizarVenda} disabled={finalizando}>
              {finalizando ? "Finalizando..." : "Confirmar venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
