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
import { Minus, ShoppingCart, Search, User, X, Package, Barcode } from "lucide-react"
import { formatarMoeda, mascaraTelefone, mascaraCpfCnpj, mascaraMoeda, valorMoedaParaNumero } from "@/lib/mascaras"
import { CANAIS_VENDA_BALCAO, type CanalPedido } from "@/lib/canal-pedido"
import { LabelCanal } from "@/components/admin/label-canal"
import { ROTULOS_STATUS, statusExibicao } from "@/lib/status-pedido"
import { FORMAS_PAGAMENTO_BALCAO, rotuloFormaPagamento } from "@/lib/formas-pagamento"
import { registrarAuditoria } from "@/lib/auditoria"
import { validarCodigoBarras } from "@/lib/codigo-barras"

export type Produto = {
  id: string
  nome: string
  preco: string
  preco_promocional: string | null
  estoque: number
  codigo_barras: string | null
  categorias: string[]
  imagem_url: string | null
  marca: "colorido" | "branco"
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
  canal: CanalPedido | null
  marca: "colorido" | "branco"
  status: string
  total: string
  forma_pagamento: string | null
  criado_em: string
  cliente_nome: string
}

type PedidoDetalhe = {
  id: string
  status: string
  total: string
  forma_pagamento: string | null
  criado_em: string
  origem: "site" | "balcao"
  canal: CanalPedido | null
  cliente_nome: string
  cliente_email: string | null
  cliente_telefone: string | null
  itens: { quantidade: number; preco_unitario: string; produto_nome: string }[]
}

type ItemCarrinho = {
  produtoId: string
  nome: string
  preco: number
  quantidade: number
  estoqueDisponivel: number
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
  const [codigoBarrasLido, setCodigoBarrasLido] = useState("")
  const [erroCodigoBarras, setErroCodigoBarras] = useState("")
  const [modalCadastroRapido, setModalCadastroRapido] = useState<{ codigoBarras: string } | null>(null)
  const [novoProdutoNome, setNovoProdutoNome] = useState("")
  const [novoProdutoPreco, setNovoProdutoPreco] = useState("")
  const [cadastrandoRapido, setCadastrandoRapido] = useState(false)
  const [erroCadastroRapido, setErroCadastroRapido] = useState("")
  const [categoriaAtiva, setCategoriaAtiva] = useState("todas")
  const [marcaAtiva, setMarcaAtiva] = useState<"todas" | "colorido" | "branco">("todas")
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])

  const [clientes, setClientes] = useState(clientesIniciais)
  const tiposEntrega = tiposEntregaIniciais
  const [buscaCliente, setBuscaCliente] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [clienteNomeAvulso, setClienteNomeAvulso] = useState("")
  const [clienteTelefoneAvulso, setClienteTelefoneAvulso] = useState("")

  // Cadastro completo de cliente novo (grava em TAB_CLIENTE de verdade, em
  // vez do "cadastro rapido" que so guarda nome/telefone soltos no pedido) -
  // fica disponivel pro proximo atendimento tambem, nao so essa venda.
  const [cadastrandoCliente, setCadastrandoCliente] = useState(false)
  const [novoClienteNome, setNovoClienteNome] = useState("")
  const [novoClienteEmail, setNovoClienteEmail] = useState("")
  const [novoClienteTelefone, setNovoClienteTelefone] = useState("")
  const [novoClienteCpfCnpj, setNovoClienteCpfCnpj] = useState("")
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const [erroCliente, setErroCliente] = useState("")

  async function cadastrarCliente() {
    setErroCliente("")
    setSalvandoCliente(true)

    const resposta = await fetch("/api/admin/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: novoClienteNome,
        email: novoClienteEmail || null,
        telefone: novoClienteTelefone.replace(/\D/g, "") || null,
        cpf_cnpj: novoClienteCpfCnpj.replace(/\D/g, "") || null,
      }),
    })

    setSalvandoCliente(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErroCliente(dados.erro || "Erro ao cadastrar cliente")
      return
    }

    const clienteCriado = await resposta.json()
    const cliente: Cliente = { id: clienteCriado.id, nome: clienteCriado.nome, email: clienteCriado.email || "", telefone: clienteCriado.telefone }
    setClientes((atual) => [...atual, cliente].sort((a, b) => a.nome.localeCompare(b.nome)))
    setClienteSelecionado(cliente)
    setCadastrandoCliente(false)
    setNovoClienteNome("")
    setNovoClienteEmail("")
    setNovoClienteTelefone("")
    setNovoClienteCpfCnpj("")
  }

  const [vendas, setVendas] = useState<Venda[]>(vendasIniciais)
  const [filtroOrigem, setFiltroOrigem] = useState<"todas" | "site" | "balcao">("todas")
  const [filtroMarcaVendas, setFiltroMarcaVendas] = useState<"todas" | "colorido" | "branco">("todas")
  const [filtroCanalVendas, setFiltroCanalVendas] = useState<"todos" | CanalPedido>("todos")
  const [vendaPreview, setVendaPreview] = useState<PedidoDetalhe | null>(null)
  const [carregandoPreview, setCarregandoPreview] = useState<string | null>(null)

  async function abrirPreview(vendaId: string) {
    setCarregandoPreview(vendaId)
    const resposta = await fetch(`/api/admin/pedidos/${vendaId}`)
    setCarregandoPreview(null)
    if (!resposta.ok) return
    setVendaPreview(await resposta.json())
  }

  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [canal, setCanal] = useState<string>("balcao")
  const [tipoEntregaId, setTipoEntregaId] = useState<string>("nenhum")
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const categorias = useMemo(() => {
    const nomes = new Set<string>()
    produtos
      .filter((p) => marcaAtiva === "todas" || p.marca === marcaAtiva)
      .forEach((p) => p.categorias.forEach((c) => nomes.add(c)))
    return ["todas", ...Array.from(nomes).sort()]
  }, [produtos, marcaAtiva])

  const produtosFiltrados = produtos.filter((p) => {
    const bateMarca = marcaAtiva === "todas" || p.marca === marcaAtiva
    const bateCategoria = categoriaAtiva === "todas" || p.categorias.includes(categoriaAtiva)
    const bateBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
    return bateMarca && bateCategoria && bateBusca
  })

  const clientesFiltrados = buscaCliente
    ? clientes.filter((c) =>
        `${c.nome} ${c.email} ${c.telefone || ""}`.toLowerCase().includes(buscaCliente.toLowerCase())
      )
    : []

  const vendasFiltradas = vendas.filter((v) => {
    const bateOrigem = filtroOrigem === "todas" || v.origem === filtroOrigem
    const bateMarca = filtroMarcaVendas === "todas" || v.marca === filtroMarcaVendas
    const canalVenda = v.canal ?? (v.origem === "balcao" ? "balcao" : "site")
    const bateCanal = filtroCanalVendas === "todos" || canalVenda === filtroCanalVendas
    return bateOrigem && bateMarca && bateCanal
  })

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

  // Leitor USB de codigo de barras funciona como teclado: digita os numeros
  // rapido e manda Enter no final - so precisa escutar o Enter e casar com
  // o produto pelo codigo_barras cadastrado.
  function lerCodigoBarras(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return
    evento.preventDefault()

    const codigo = codigoBarrasLido.trim()
    setCodigoBarrasLido("")
    if (!codigo) return

    const produto = produtos.find((p) => p.codigo_barras === codigo)
    if (!produto) {
      // Codigo invalido (leitura falha, digitacao errada) - nao oferece
      // cadastro rapido pra nao criar produto com codigo de barras furado.
      if (!validarCodigoBarras(codigo)) {
        setErroCodigoBarras("Código de barras inválido (dígito verificador não confere) - leia de novo")
        return
      }
      // Produto nao cadastrado - oferece cadastro rapido em vez de so travar
      // a venda. O modal pergunta (Cancelar = nao quer cadastrar).
      setModalCadastroRapido({ codigoBarras: codigo })
      setNovoProdutoNome("")
      setNovoProdutoPreco("")
      setErroCadastroRapido("")
      return
    }

    setErroCodigoBarras("")
    adicionarAoCarrinho(produto)
  }

  async function confirmarCadastroRapido() {
    if (!modalCadastroRapido) return
    setErroCadastroRapido("")

    if (!novoProdutoNome.trim() || !valorMoedaParaNumero(novoProdutoPreco)) {
      setErroCadastroRapido("Nome e preço são obrigatórios")
      return
    }

    setCadastrandoRapido(true)
    const resposta = await fetch("/api/admin/produtos/rapido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: novoProdutoNome,
        preco: valorMoedaParaNumero(novoProdutoPreco),
        codigoBarras: modalCadastroRapido.codigoBarras,
        marca: marcaAtiva === "todas" ? "colorido" : marcaAtiva,
      }),
    })
    setCadastrandoRapido(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErroCadastroRapido(dados.erro || "Erro ao cadastrar produto")
      return
    }

    const produtoCriado = await resposta.json()
    const produtoCompleto: Produto = {
      id: produtoCriado.id,
      nome: produtoCriado.nome,
      preco: produtoCriado.preco,
      preco_promocional: null,
      estoque: produtoCriado.estoque,
      codigo_barras: produtoCriado.codigo_barras,
      categorias: [],
      imagem_url: null,
      marca: produtoCriado.marca,
    }
    setProdutos((atual) => [...atual, produtoCompleto])
    registrarAuditoria({
      tela: "Venda Balcão (cadastro rápido)",
      acao: "cadastro",
      tabela: "TAB_PRODUTO",
      registroId: produtoCriado.id,
      depois: { nome: produtoCriado.nome, codigo_barras: produtoCriado.codigo_barras },
    })

    adicionarAoCarrinho(produtoCompleto)
    setModalCadastroRapido(null)
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
        canal,
        clienteId: clienteSelecionado?.id || null,
        clienteNomeAvulso: clienteSelecionado ? null : clienteNomeAvulso || null,
        clienteTelefoneAvulso: clienteSelecionado ? null : clienteTelefoneAvulso.replace(/\D/g, "") || null,
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
    setCanal("balcao")
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Venda Balcão</h1>
        <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
          <TabsList>
            <TabsTrigger value="produtos">
              <Package size={14} className="mr-1.5" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="vendas">
              <span className="mr-1.5 text-sm leading-none">📋</span>
              Vendas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {aba === "vendas" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={filtroOrigem} onValueChange={(v) => setFiltroOrigem(v as typeof filtroOrigem)}>
              <TabsList>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="site">Site</TabsTrigger>
                <TabsTrigger value="balcao">Balcão</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select
              value={filtroMarcaVendas}
              onValueChange={(v) => setFiltroMarcaVendas((v || "todas") as typeof filtroMarcaVendas)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as lojas</SelectItem>
                <SelectItem value="colorido">Coisas Brasileiras</SelectItem>
                <SelectItem value="branco">Porcelanas Brancas</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtroCanalVendas}
              onValueChange={(v) => setFiltroCanalVendas((v || "todos") as typeof filtroCanalVendas)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os canais</SelectItem>
                <SelectItem value="site">
                  <LabelCanal canal="site" />
                </SelectItem>
                <SelectItem value="whatsapp">
                  <LabelCanal canal="whatsapp" />
                </SelectItem>
                <SelectItem value="instagram">
                  <LabelCanal canal="instagram" />
                </SelectItem>
                <SelectItem value="balcao">
                  <LabelCanal canal="balcao" />
                </SelectItem>
                <SelectItem value="mercadolivre">
                  <LabelCanal canal="mercadolivre" />
                </SelectItem>
                <SelectItem value="shopee">
                  <LabelCanal canal="shopee" />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                        <th className="p-4 font-medium">Canal</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendasFiltradas.map((venda) => (
                        <tr
                          key={venda.id}
                          onClick={() => abrirPreview(venda.id)}
                          className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-accent"
                        >
                          <td className="p-4">
                            <span className="hover:underline">
                              {carregandoPreview === venda.id ? "Carregando..." : venda.cliente_nome}
                            </span>
                          </td>
                          <td className="p-4">
                            <LabelCanal canal={venda.canal ?? (venda.origem === "balcao" ? "balcao" : "site")} />
                          </td>
                          <td className="p-4 text-slate-500">
                            <span
                              className={
                                statusExibicao(venda.status, venda.criado_em) === "Provavelmente abandonado"
                                  ? "text-amber-500"
                                  : undefined
                              }
                            >
                              {statusExibicao(venda.status, venda.criado_em)}
                            </span>
                            {venda.forma_pagamento && (
                              <span className="ml-1 text-xs text-slate-400">
                                · {rotuloFormaPagamento(venda.forma_pagamento)}
                              </span>
                            )}
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
              <div className="relative min-w-[180px] max-w-xs flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative min-w-[160px] max-w-56 flex-1">
                <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Ler código de barras..."
                  value={codigoBarrasLido}
                  onChange={(e) => {
                    setCodigoBarrasLido(e.target.value)
                    setErroCodigoBarras("")
                  }}
                  onKeyDown={lerCodigoBarras}
                  className="pl-9"
                  autoFocus
                />
              </div>
              {(["todas", "colorido", "branco"] as const).map((opcao) => (
                <button
                  key={opcao}
                  onClick={() => {
                    setMarcaAtiva(opcao)
                    setCategoriaAtiva("todas")
                  }}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    marcaAtiva === opcao
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-input text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opcao === "todas"
                    ? "Todos os sites"
                    : opcao === "branco"
                      ? "⚪ Porcelanas Brancas"
                      : "🎨 Coisas Brasileiras"}
                </button>
              ))}
              <div className="mx-1 h-6 w-px bg-border" />
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
            {erroCodigoBarras && <p className="text-sm text-red-500">{erroCodigoBarras}</p>}

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
                    <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent">
                      <CardContent className="space-y-2 p-3">
                        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-slate-100 text-xs text-slate-400">
                          <span
                            className="absolute left-1 top-1 z-10 text-sm leading-none"
                            title={produto.marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras"}
                          >
                            {produto.marca === "branco" ? "⚪" : "🎨"}
                          </span>
                          {produto.imagem_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={produto.imagem_url}
                              alt=""
                              className="absolute inset-0 h-full w-full rounded-md object-cover"
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
                          <span className="text-xs leading-none">➕</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removerItem(item.produtoId)}
                        >
                          <span className="text-sm leading-none">🗑️</span>
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
                    {cadastrandoCliente ? (
                      <div className="space-y-2 rounded-md border border-input p-3">
                        <p className="text-xs font-medium text-slate-500">Cadastro completo de cliente</p>
                        <Input
                          placeholder="Nome *"
                          value={novoClienteNome}
                          onChange={(e) => setNovoClienteNome(e.target.value)}
                        />
                        <Input
                          type="email"
                          placeholder="Email (opcional)"
                          value={novoClienteEmail}
                          onChange={(e) => setNovoClienteEmail(e.target.value)}
                        />
                        <Input
                          placeholder="Telefone"
                          inputMode="tel"
                          value={novoClienteTelefone}
                          onChange={(e) => setNovoClienteTelefone(mascaraTelefone(e.target.value))}
                        />
                        <Input
                          placeholder="CPF/CNPJ (opcional)"
                          inputMode="numeric"
                          value={novoClienteCpfCnpj}
                          onChange={(e) => setNovoClienteCpfCnpj(mascaraCpfCnpj(e.target.value))}
                        />
                        {erroCliente && <p className="text-xs text-red-500">{erroCliente}</p>}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setCadastrandoCliente(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={cadastrarCliente}
                            disabled={salvandoCliente || !novoClienteNome.trim()}
                          >
                            {salvandoCliente ? "Salvando..." : "Salvar cliente"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setCadastrandoCliente(true)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          + Cadastrar novo cliente (completo)
                        </button>
                        <p className="text-xs text-slate-400">Ou cadastro rápido, sem conta no site:</p>
                        <Input
                          placeholder="Nome"
                          value={clienteNomeAvulso}
                          onChange={(e) => setClienteNomeAvulso(e.target.value)}
                        />
                        <Input
                          placeholder="Telefone"
                          value={clienteTelefoneAvulso}
                          onChange={(e) => setClienteTelefoneAvulso(mascaraTelefone(e.target.value))}
                          inputMode="tel"
                        />
                      </>
                    )}
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
                  {FORMAS_PAGAMENTO_BALCAO.map((forma) => (
                    <SelectItem key={forma.valor} value={forma.valor}>
                      {forma.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Canal da venda</Label>
              <Select value={canal} onValueChange={(v) => setCanal(v || "balcao")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANAIS_VENDA_BALCAO.map((c) => (
                    <SelectItem key={c.valor} value={c.valor}>
                      {c.rotulo}
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
                    <SelectItem value="nenhum">Sem entrega (venda direta no balcão)</SelectItem>
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

      <Dialog open={!!vendaPreview} onOpenChange={(aberto) => !aberto && setVendaPreview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da venda</DialogTitle>
          </DialogHeader>

          {vendaPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{vendaPreview.cliente_nome}</p>
                  {vendaPreview.cliente_telefone && (
                    <p className="text-xs text-slate-500">{vendaPreview.cliente_telefone}</p>
                  )}
                </div>
                <LabelCanal
                  canal={vendaPreview.canal ?? (vendaPreview.origem === "balcao" ? "balcao" : "site")}
                  className="rounded-full bg-slate-100 px-2 py-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{ROTULOS_STATUS[vendaPreview.status] ?? vendaPreview.status}</span>
                <span>{new Date(vendaPreview.criado_em).toLocaleString("pt-BR")}</span>
              </div>

              <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                {vendaPreview.itens.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 text-sm">
                    <span>
                      {item.quantidade}x {item.produto_nome}
                    </span>
                    <span className="font-medium">
                      {formatarMoeda(String(Number(item.preco_unitario) * item.quantidade))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatarMoeda(vendaPreview.total)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVendaPreview(null)}>
              Fechar
            </Button>
            {vendaPreview && (
              <Button nativeButton={false} render={<Link href={`/admin/pedidos/${vendaPreview.id}`} />}>
                Abrir pedido completo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!modalCadastroRapido} onOpenChange={(aberto) => !aberto && setModalCadastroRapido(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Produto não cadastrado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Nenhum produto com o código <strong>{modalCadastroRapido?.codigoBarras}</strong>. Deseja
              cadastrar agora pra continuar a venda?
            </p>
            {modalCadastroRapido && validarCodigoBarras(modalCadastroRapido.codigoBarras) && (
              <p className="text-xs text-emerald-500">Código de barras válido</p>
            )}
            <div className="space-y-2">
              <Label>Nome do produto</Label>
              <Input value={novoProdutoNome} onChange={(e) => setNovoProdutoNome(e.target.value)} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                inputMode="numeric"
                value={novoProdutoPreco}
                onChange={(e) => setNovoProdutoPreco(mascaraMoeda(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <p className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-600">
              Esse é um cadastro rápido, só com o essencial pra vender agora. Depois vá em Produtos e
              complete o cadastro (NCM, categoria, fotos, dimensões) antes de emitir nota fiscal desse item.
            </p>
            {erroCadastroRapido && <p className="text-sm text-red-500">{erroCadastroRapido}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCadastroRapido(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCadastroRapido} disabled={cadastrandoRapido}>
              {cadastrandoRapido ? "Cadastrando..." : "Cadastrar e adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
