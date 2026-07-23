"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, Plus, List } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"

type Categoria = {
  id: string
  nome: string
  slug: string
  ativa: boolean
  criado_em: string
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState("lista")
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [nome, setNome] = useState("")
  const [ativa, setAtiva] = useState(true)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    const resposta = await fetch("/api/admin/categorias")
    const dados = await resposta.json()
    setCategorias(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirNova() {
    setCategoriaEditando(null)
    setNome("")
    setAtiva(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEditando(categoria)
    setNome(categoria.nome)
    setAtiva(categoria.ativa)
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
      body: JSON.stringify({ nome, ativa }),
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
    carregar()
  }

  async function excluir(categoria: Categoria) {
    if (!confirm(`Excluir a categoria "${categoria.nome}"?`)) return
    await fetch(`/api/admin/categorias/${categoria.id}`, { method: "DELETE" })
    registrarAuditoria({
      tela: "Categorias",
      acao: "exclusao",
      tabela: "TAB_CATEGORIA",
      registroId: categoria.id,
      antes: { nome: categoria.nome, ativa: categoria.ativa },
    })
    carregar()
  }

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
              {carregando ? (
                <p className="p-6 text-sm text-neutral-400">Carregando...</p>
              ) : categorias.length === 0 ? (
                <p className="p-6 text-sm text-neutral-400">Nenhuma categoria cadastrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-left text-neutral-400">
                        <th className="p-4 font-medium">Nome</th>
                        <th className="p-4 font-medium">Slug</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map((categoria) => (
                        <tr key={categoria.id} className="border-b border-neutral-800 last:border-0">
                          <td className="p-4">{categoria.nome}</td>
                          <td className="p-4 text-neutral-400">{categoria.slug}</td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                categoria.ativa
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-neutral-700/40 text-neutral-400"
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
