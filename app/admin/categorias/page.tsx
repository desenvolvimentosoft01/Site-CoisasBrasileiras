"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Trash2, Pencil, Plus } from "lucide-react"

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
  const [modalAberto, setModalAberto] = useState(false)
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
    setModalAberto(true)
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEditando(categoria)
    setNome(categoria.nome)
    setAtiva(categoria.ativa)
    setErro("")
    setModalAberto(true)
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

    setModalAberto(false)
    carregar()
  }

  async function excluir(categoria: Categoria) {
    if (!confirm(`Excluir a categoria "${categoria.nome}"?`)) return
    await fetch(`/api/admin/categorias/${categoria.id}`, { method: "DELETE" })
    carregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button onClick={abrirNova}>
          <Plus size={16} className="mr-2" />
          Nova categoria
        </Button>
      </div>

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

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{categoriaEditando ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
            </div>

            {categoriaEditando && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ativa</label>
                <Switch checked={ativa} onCheckedChange={setAtiva} />
              </div>
            )}

            {erro && <p className="text-sm text-red-500">{erro}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando || !nome.trim()}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
