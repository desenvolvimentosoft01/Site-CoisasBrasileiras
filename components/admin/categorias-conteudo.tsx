"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, Plus, List, ImagePlus, X, CornerDownRight } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"

export type Categoria = {
  id: string
  nome: string
  slug: string
  imagem_url: string | null
  ativa: boolean
  categoria_pai_id: string | null
  criado_em: string
}

// Recebe os dados ja carregados pelo Server Component (page.tsx) - so refaz
// o fetch depois de uma mutacao (salvar/excluir), nunca na carga inicial da
// tela, pra nao ter o flash de "Carregando..." toda vez que o admin navega ate aqui.
export function CategoriasConteudo({ categoriasIniciais }: { categoriasIniciais: Categoria[] }) {
  const confirmar = useConfirmar()
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais)
  const [aba, setAba] = useState("lista")
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [nome, setNome] = useState("")
  const [ativa, setAtiva] = useState(true)
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
    setNome("")
    setAtiva(true)
    setCategoriaPaiId(null)
    setImagemUrl(null)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEditando(categoria)
    setNome(categoria.nome)
    setAtiva(categoria.ativa)
    setCategoriaPaiId(categoria.categoria_pai_id)
    setImagemUrl(categoria.imagem_url)
    setErro("")
    setAba("formulario")
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
      body: JSON.stringify({ nome, ativa, imagemUrl, categoriaPaiId }),
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
    recarregar()
  }

  // Categorias principais primeiro, com as subcategorias logo abaixo do
  // respectivo pai (em vez de tudo em ordem alfabetica misturado).
  const principais = categorias.filter((c) => !c.categoria_pai_id)
  const categoriasOrdenadas = principais.flatMap((principal) => [
    principal,
    ...categorias.filter((c) => c.categoria_pai_id === principal.id),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categorias</h1>

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
              Nova categoria
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4">
          <Card>
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
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriasOrdenadas.map((categoria) => (
                        <tr key={categoria.id} className="border-b border-slate-200 last:border-0">
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
                            <span className={categoria.categoria_pai_id ? "flex items-center gap-1.5 pl-4 text-slate-600" : "font-medium"}>
                              {categoria.categoria_pai_id && <CornerDownRight size={14} className="text-slate-400" />}
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
                            <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(categoria)}>
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon-lg" onClick={() => excluir(categoria)}>
                              <Trash2 size={16} className="text-red-500" />
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

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">
              {categoriaEditando ? `Editando: ${categoriaEditando.nome}` : "Nova categoria"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAba("lista")}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando || !nome.trim()}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="max-w-lg space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
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
                    .filter((c) => !c.categoria_pai_id && c.id !== categoriaEditando?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Escolha uma categoria pai para criar uma subcategoria (ex: "Bowls" dentro de "Casa"). Deixe em branco para uma categoria principal, exibida no menu do site.
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
    </div>
  )
}
