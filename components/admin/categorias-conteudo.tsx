"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, Plus, ImagePlus, X, CornerDownRight, FilePlus, Save, Eraser } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"

export type Categoria = {
  id: string
  nome: string
  slug: string
  imagem_url: string | null
  ativa: boolean
  categoria_pai_id: string | null
  marca: "colorido" | "branco"
  criado_em: string
}

// Recebe os dados ja carregados pelo Server Component (page.tsx) - so refaz
// o fetch depois de uma mutacao (salvar/excluir), nunca na carga inicial da
// tela, pra nao ter o flash de "Carregando..." toda vez que o admin navega ate aqui.
export function CategoriasConteudo({ categoriasIniciais }: { categoriasIniciais: Categoria[] }) {
  const confirmar = useConfirmar()
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais)
  const [aba, setAba] = useState("lista")
  const [filtroMarca, setFiltroMarca] = useState<"todas" | "colorido" | "branco">("todas")
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Categoria | null>(null)
  const [nome, setNome] = useState("")
  const [ativa, setAtiva] = useState(true)
  const [marca, setMarca] = useState<"colorido" | "branco">("colorido")
  const [categoriaPaiId, setCategoriaPaiId] = useState<string | null>(null)
  const [imagemUrl, setImagemUrl] = useState<string | null>(null)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  async function selecionarImagem(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setErro("")
    setEnviandoImagem(true)

    const formData = new FormData()
    formData.append("arquivo", arquivo)
    formData.append("pasta", "categorias")

    const resposta = await fetch("/api/admin/upload", { method: "POST", body: formData })
    setEnviandoImagem(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao enviar imagem")
      return
    }

    const { url } = await resposta.json()
    setImagemUrl(url)
    if (inputArquivoRef.current) inputArquivoRef.current.value = ""
  }

  async function recarregar() {
    const resposta = await fetch("/api/admin/categorias")
    setCategorias(await resposta.json())
  }

  function abrirNova() {
    setCategoriaEditando(null)
    setLinhaSelecionada(null)
    setNome("")
    setAtiva(true)
    setMarca(filtroMarca === "todas" ? "colorido" : filtroMarca)
    setCategoriaPaiId(null)
    setImagemUrl(null)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEditando(categoria)
    setLinhaSelecionada(categoria.id)
    setNome(categoria.nome)
    setAtiva(categoria.ativa)
    setMarca(categoria.marca)
    setCategoriaPaiId(categoria.categoria_pai_id)
    setImagemUrl(categoria.imagem_url)
    setErro("")
    setAba("formulario")
  }

  function limpar() {
    if (categoriaEditando) {
      setNome(categoriaEditando.nome)
      setAtiva(categoriaEditando.ativa)
      setMarca(categoriaEditando.marca)
      setCategoriaPaiId(categoriaEditando.categoria_pai_id)
      setImagemUrl(categoriaEditando.imagem_url)
    } else {
      setNome("")
      setAtiva(true)
      setMarca(filtroMarca === "todas" ? "colorido" : filtroMarca)
      setCategoriaPaiId(null)
      setImagemUrl(null)
    }
    setErro("")
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const url = categoriaEditando
      ? `/api/admin/categorias/${categoriaEditando.id}`
      : "/api/admin/categorias"
    const method = categoriaEditando ? "PUT" : "POST"

    const resposta = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, ativa, imagemUrl, categoriaPaiId, marca }),
    })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    const salva = await resposta.json()
    registrarAuditoria({
      tela: "Categorias",
      acao: categoriaEditando ? "edicao" : "cadastro",
      tabela: "TAB_CATEGORIA",
      registroId: salva.id,
      antes: categoriaEditando ? { nome: categoriaEditando.nome, ativa: categoriaEditando.ativa } : null,
      depois: { nome: salva.nome, ativa: salva.ativa },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(categoria: Categoria) {
    if (!(await confirmar({ descricao: `Excluir a categoria "${categoria.nome}"?`, destrutivo: true }))) return
    await fetch(`/api/admin/categorias/${categoria.id}`, { method: "DELETE" })
    registrarAuditoria({
      tela: "Categorias",
      acao: "exclusao",
      tabela: "TAB_CATEGORIA",
      registroId: categoria.id,
      antes: { nome: categoria.nome, ativa: categoria.ativa },
    })
    setLinhaSelecionada(null)
    recarregar()
  }

  const categoriaSelecionada = categorias.find((c) => c.id === linhaSelecionada) ?? null

  const categoriasFiltradas =
    filtroMarca === "todas" ? categorias : categorias.filter((c) => c.marca === filtroMarca)

  // Categorias principais primeiro, com as subcategorias logo abaixo do
  // respectivo pai (em vez de tudo em ordem alfabetica misturado).
  const principais = categoriasFiltradas.filter((c) => !c.categoria_pai_id)
  const categoriasOrdenadas = principais.flatMap((principal) => [
    principal,
    ...categoriasFiltradas.filter((c) => c.categoria_pai_id === principal.id),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categorias</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList>
          <TabsTrigger value="lista">
            <span className="mr-1.5 text-sm leading-none">📋</span>
            Grade
          </TabsTrigger>
          <TabsTrigger value="formulario">
            <Plus size={14} className="mr-1.5" />
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4 space-y-4">
          <Tabs value={filtroMarca} onValueChange={(v) => setFiltroMarca(v as typeof filtroMarca)}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="colorido">Coloridas</TabsTrigger>
              <TabsTrigger value="branco">Brancas</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="overflow-hidden py-0">
            <BarraFerramentas
              botoes={[
                { label: "Novo", icon: FilePlus, onClick: abrirNova, variante: "primary" },
                {
                  label: "Editar",
                  icon: Pencil,
                  onClick: () => categoriaSelecionada && abrirEdicao(categoriaSelecionada),
                  disabled: !categoriaSelecionada,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => categoriaSelecionada && excluir(categoriaSelecionada),
                  disabled: !categoriaSelecionada,
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {categorias.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma categoria cadastrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Imagem</th>
                        <th className="p-4 font-medium">Nome</th>
                        <th className="p-4 font-medium">Slug</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriasOrdenadas.map((categoria) => (
                        <tr
                          key={categoria.id}
                          onClick={() =>
                            setLinhaSelecionada((atual) => (atual === categoria.id ? null : categoria.id))
                          }
                          onDoubleClick={() => abrirEdicao(categoria)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === categoria.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4">
                            {categoria.imagem_url ? (
                              <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                <Image src={categoria.imagem_url} alt="" fill className="object-cover" sizes="40px" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-slate-100" />
                            )}
                          </td>
                          <td className="p-4">
                            <span className={categoria.categoria_pai_id ? "flex items-center gap-1.5 pl-4 text-slate-600" : "flex items-center gap-1.5 font-medium"}>
                              {categoria.categoria_pai_id && <CornerDownRight size={14} className="text-slate-400" />}
                              <span
                                className="text-sm leading-none"
                                title={categoria.marca === "branco" ? "Branco" : "Colorido"}
                              >
                                {categoria.marca === "branco" ? "⚪" : "🎨"}
                              </span>
                              {categoria.nome}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{categoria.slug}</td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                categoria.ativa
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {categoria.ativa ? "Ativa" : "Inativa"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(categoria)
                              }}
                            >
                              <span className="text-base leading-none">👁️</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirEdicao(categoria)
                              }}
                            >
                              <span className="text-base leading-none">✏️</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                excluir(categoria)
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

        <TabsContent value="formulario" className="mt-4 space-y-0">
          <p className="mb-2 px-1 text-sm font-medium text-muted-foreground">
            {categoriaEditando ? `Editando: ${categoriaEditando.nome}` : "Nova categoria"}
          </p>
          <Card className="overflow-hidden py-0">
            <BarraFerramentas
              botoes={[
                { label: "Gravar", icon: Save, onClick: salvar, variante: "success", disabled: salvando || !nome.trim() },
                { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
                { label: "Cancelar", icon: X, onClick: () => setAba("lista"), variante: "danger" },
              ]}
            />
            <CardContent className="max-w-lg space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
              </div>

              <div className="space-y-2">
                <Label>Marca</Label>
                <div className="flex flex-wrap gap-2">
                  {(["colorido", "branco"] as const).map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => {
                        setMarca(opcao)
                        if (categorias.find((c) => c.id === categoriaPaiId)?.marca !== opcao) {
                          setCategoriaPaiId(null)
                        }
                      }}
                      className={`rounded-full border px-3 py-1 text-sm capitalize transition-colors ${
                        marca === opcao
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-input text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {opcao}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria pai</Label>
                <select
                  value={categoriaPaiId ?? ""}
                  onChange={(e) => setCategoriaPaiId(e.target.value || null)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Nenhuma (categoria principal)</option>
                  {categorias
                    .filter((c) => !c.categoria_pai_id && c.id !== categoriaEditando?.id && c.marca === marca)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Escolha uma categoria pai para criar uma subcategoria (ex: &quot;Bowls&quot; dentro de &quot;Casa&quot;). Deixe em branco para uma categoria principal, exibida no menu do site.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Imagem</Label>
                {imagemUrl ? (
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-border">
                    <Image src={imagemUrl} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagemUrl(null)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="Remover imagem"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputArquivoRef.current?.click()}
                    disabled={enviandoImagem}
                    className="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-accent"
                  >
                    <ImagePlus size={20} />
                    <span className="text-xs">{enviandoImagem ? "Enviando..." : "Adicionar"}</span>
                  </button>
                )}
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={selecionarImagem}
                />
              </div>

              {categoriaEditando && (
                <div className="flex items-center justify-between">
                  <Label>Ativa</Label>
                  <Switch checked={ativa} onCheckedChange={setAtiva} />
                </div>
              )}

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModalDetalhe
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe?.nome ?? ""}
        campos={
          detalhe
            ? [
                { label: "Marca", valor: detalhe.marca === "branco" ? "Branco" : "Colorido" },
                { label: "Slug", valor: detalhe.slug },
                {
                  label: "Categoria pai",
                  valor: detalhe.categoria_pai_id
                    ? categorias.find((c) => c.id === detalhe.categoria_pai_id)?.nome
                    : "Nenhuma (categoria principal)",
                },
                { label: "Status", valor: detalhe.ativa ? "Ativa" : "Inativa" },
              ]
            : []
        }
      />
    </div>
  )
}
