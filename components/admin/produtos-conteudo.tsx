"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Pencil, Trash2, AlertTriangle, FilePlus } from "lucide-react"
import { toast } from "sonner"
import { ProdutoForm } from "@/components/admin/produto-form"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"

export type Produto = {
  id: string
  // Numero curto do cadastro, gerado pelo banco (migration 058). Diferente do
  // SKU, que e do fornecedor/fabricante e pode nem existir.
  codigo: number
  nome: string
  sku: string | null
  ncm: string | null
  codigo_barras: string | null
  preco: string
  preco_promocional: string | null
  estoque: number
  estoque_minimo: number
  ativo: boolean
  marca: "colorido" | "branco"
  categorias: string[]
}

type ProdutoDetalhado = {
  id: string
  nome: string
  descricao: string | null
  preco: string
  preco_promocional: string | null
  preco_clube: string | null
  preco_clube_tipo: "fixo" | "percentual"
  custo: string
  estoque: number
  estoque_minimo: number
  ativo: boolean
  marca: "colorido" | "branco"
  sku: string | null
  ncm: string | null
  codigo_barras: string | null
  peso_kg: string | null
  altura_cm: string | null
  largura_cm: string | null
  comprimento_cm: string | null
  categoriaIds: string[]
  imagens: { url: string }[]
}

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProdutosConteudo({ produtosIniciais }: { produtosIniciais: Produto[] }) {
  const confirmar = useConfirmar()
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [aba, setAba] = useState("lista")
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "inativos">("ativos")
  const [filtroMarca, setFiltroMarca] = useState<"todas" | "colorido" | "branco">("todas")
  const [editando, setEditando] = useState<ProdutoDetalhado | undefined>(undefined)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Produto | null>(null)

  const produtosFiltrados = produtos.filter((p) => {
    if (filtroStatus === "ativos" && !p.ativo) return false
    if (filtroStatus === "inativos" && p.ativo) return false
    if (filtroMarca !== "todas" && p.marca !== filtroMarca) return false
    return true
  })

  async function recarregar() {
    const resposta = await fetch("/api/admin/produtos")
    setProdutos(await resposta.json())
  }

  function abrirNovo() {
    setEditando(undefined)
    setLinhaSelecionada(null)
    setAba("formulario")
  }

  async function abrirEdicao(produto: Produto) {
    setLinhaSelecionada(produto.id)
    setAba("formulario")
    setCarregandoDetalhe(true)
    const resposta = await fetch(`/api/admin/produtos/${produto.id}`)
    setEditando(await resposta.json())
    setCarregandoDetalhe(false)
  }

  function handleSalvo() {
    setAba("lista")
    setEditando(undefined)
    recarregar()
  }

  async function excluir(produto: Produto) {
    if (!(await confirmar({ descricao: `Excluir o produto "${produto.nome}"?`, destrutivo: true, consequencia: "O produto sai da loja junto com as imagens dele. Produto que já foi vendido não pode ser excluído — nesse caso, desative." }))) return
    const resposta = await fetch(`/api/admin/produtos/${produto.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir")
      return
    }
    registrarAuditoria({
      tela: "Produtos",
      acao: "exclusao",
      tabela: "TAB_PRODUTO",
      registroId: produto.id,
      antes: { nome: produto.nome, preco: produto.preco, estoque: produto.estoque },
    })
    setLinhaSelecionada(null)
    recarregar()
  }

  const produtoSelecionado = produtos.find((p) => p.id === linhaSelecionada) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Produtos</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList>
          <TabsTrigger value="lista">
            <span className="mr-1.5 text-sm leading-none">📋</span>
            Grade
          </TabsTrigger>
          <TabsTrigger value="formulario">
            <span className="mr-1.5 text-sm leading-none">➕</span>
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Tabs value={filtroMarca} onValueChange={(v) => setFiltroMarca(v as typeof filtroMarca)}>
              <TabsList>
                <TabsTrigger value="todas">Todos</TabsTrigger>
                <TabsTrigger value="colorido">🎨 Coisas Brasileiras</TabsTrigger>
                <TabsTrigger value="branco">⚪ Porcelanas Brancas</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
              <TabsList>
                <TabsTrigger value="ativos">Ativos</TabsTrigger>
                <TabsTrigger value="inativos">Inativos</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="overflow-hidden py-0">
            <BarraFerramentas
              botoes={[
                { label: "Novo", icon: FilePlus, onClick: abrirNovo, variante: "primary" },
                {
                  label: "Editar",
                  icon: Pencil,
                  onClick: () => produtoSelecionado && abrirEdicao(produtoSelecionado),
                  disabled: !produtoSelecionado,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => produtoSelecionado && excluir(produtoSelecionado),
                  disabled: !produtoSelecionado,
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {produtosFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  {produtos.length === 0 ? "Nenhum produto cadastrado ainda." : "Nenhum produto encontrado."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Cód.</th>
                        <th className="p-4 font-medium">Nome</th>
                        <th className="p-4 font-medium">SKU</th>
                        <th className="p-4 font-medium">Categorias</th>
                        <th className="p-4 font-medium">Preço</th>
                        <th className="p-4 font-medium">Estoque</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosFiltrados.map((produto) => (
                        <tr
                          key={produto.id}
                          onClick={() =>
                            setLinhaSelecionada((atual) => (atual === produto.id ? null : produto.id))
                          }
                          onDoubleClick={() => abrirEdicao(produto)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === produto.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4 font-mono text-slate-500">{produto.codigo}</td>
                          <td className="p-4">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="text-sm leading-none"
                                title={produto.marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras"}
                              >
                                {produto.marca === "branco" ? "⚪" : "🎨"}
                              </span>
                              {produto.nome}
                              {(!produto.ncm || !produto.codigo_barras) && (
                                <AlertTriangle
                                  size={14}
                                  className="text-amber-500"
                                  aria-label="Cadastro incompleto"
                                  role="img"
                                >
                                  <title>Cadastro incompleto - falta NCM e/ou código de barras</title>
                                </AlertTriangle>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{produto.sku || "-"}</td>
                          <td className="p-4 text-slate-500">
                            {produto.categorias.length > 0 ? produto.categorias.join(", ") : "-"}
                          </td>
                          <td className="p-4">
                            {produto.preco_promocional ? (
                              <span>
                                <span className="text-slate-400 line-through">
                                  {formatarPreco(produto.preco)}
                                </span>{" "}
                                {formatarPreco(produto.preco_promocional)}
                              </span>
                            ) : (
                              formatarPreco(produto.preco)
                            )}
                          </td>
                          <td className="p-4">
                            <span className={produto.estoque <= produto.estoque_minimo ? "text-amber-500" : ""}>
                              {produto.estoque}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                produto.ativo
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {produto.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(produto)
                              }}
                            >
                              <span className="text-base leading-none">👁️</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirEdicao(produto)
                              }}
                            >
                              <span className="text-base leading-none">✏️</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                excluir(produto)
                              }}
                            >
                              <span className="text-base leading-none">🗑️</span>
                            </Button>
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

        <TabsContent value="formulario" className="mt-4">
          {carregandoDetalhe ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : (
            <ProdutoForm
              key={editando?.id ?? "novo"}
              produto={editando}
              marcaPadrao={filtroMarca === "todas" ? "colorido" : filtroMarca}
              onSalvo={handleSalvo}
              onCancelar={() => setAba("lista")}
            />
          )}
        </TabsContent>
      </Tabs>

      <ModalDetalhe
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe?.nome ?? ""}
        campos={
          detalhe
            ? [
                { label: "Site", valor: detalhe.marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras" },
                { label: "SKU", valor: detalhe.sku },
                { label: "NCM", valor: detalhe.ncm },
                { label: "Código de barras", valor: detalhe.codigo_barras },
                { label: "Categorias", valor: detalhe.categorias.join(", ") },
                { label: "Preço", valor: formatarPreco(detalhe.preco) },
                { label: "Preço promocional", valor: detalhe.preco_promocional ? formatarPreco(detalhe.preco_promocional) : null },
                { label: "Estoque", valor: detalhe.estoque },
                { label: "Estoque mínimo", valor: detalhe.estoque_minimo },
                { label: "Status", valor: detalhe.ativo ? "Ativo" : "Inativo" },
              ]
            : []
        }
      />
    </div>
  )
}
