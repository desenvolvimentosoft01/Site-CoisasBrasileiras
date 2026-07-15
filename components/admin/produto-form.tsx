"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

type Categoria = { id: string; nome: string }

type ProdutoExistente = {
  id: string
  nome: string
  descricao: string | null
  preco: string
  preco_promocional: string | null
  estoque: number
  ativo: boolean
  categoriaIds: string[]
  imagens: { url: string }[]
}

export function ProdutoForm({ produto }: { produto?: ProdutoExistente }) {
  const router = useRouter()
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([])

  const [nome, setNome] = useState(produto?.nome ?? "")
  const [descricao, setDescricao] = useState(produto?.descricao ?? "")
  const [preco, setPreco] = useState(produto?.preco ?? "")
  const [precoPromocional, setPrecoPromocional] = useState(produto?.preco_promocional ?? "")
  const [estoque, setEstoque] = useState(String(produto?.estoque ?? 0))
  const [ativo, setAtivo] = useState(produto?.ativo ?? true)
  const [categoriaIds, setCategoriaIds] = useState<string[]>(produto?.categoriaIds ?? [])
  const [imagensTexto, setImagensTexto] = useState(
    produto?.imagens.map((i) => i.url).join("\n") ?? ""
  )
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch("/api/admin/categorias")
      .then((r) => r.json())
      .then(setCategoriasDisponiveis)
  }, [])

  function alternarCategoria(id: string) {
    setCategoriaIds((atual) =>
      atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]
    )
  }

  async function salvar() {
    setErro("")

    if (!nome.trim() || !preco) {
      setErro("Nome e preco sao obrigatorios")
      return
    }

    setSalvando(true)

    const corpo = {
      nome,
      descricao: descricao || null,
      preco: Number(preco),
      precoPromocional: precoPromocional ? Number(precoPromocional) : null,
      estoque: Number(estoque) || 0,
      ativo,
      categoriaIds,
      imagensUrls: imagensTexto
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    }

    const url = produto ? `/api/admin/produtos/${produto.id}` : "/api/admin/produtos"
    const method = produto ? "PUT" : "POST"

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

    router.push("/admin/produtos")
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <textarea
              className="min-h-24 w-full rounded-md border border-neutral-700 bg-transparent p-3 text-sm"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preco (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Preco promocional (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={precoPromocional}
                onChange={(e) => setPrecoPromocional(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estoque</Label>
              <Input
                type="number"
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Ativo</Label>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categorias</Label>
            <div className="flex flex-wrap gap-2">
              {categoriasDisponiveis.map((categoria) => (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => alternarCategoria(categoria.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    categoriaIds.includes(categoria.id)
                      ? "border-emerald-500 bg-emerald-600/20 text-emerald-400"
                      : "border-neutral-700 text-neutral-400"
                  }`}
                >
                  {categoria.nome}
                </button>
              ))}
              {categoriasDisponiveis.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Nenhuma categoria cadastrada ainda.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagens (uma URL por linha)</Label>
            <textarea
              className="min-h-24 w-full rounded-md border border-neutral-700 bg-transparent p-3 text-sm"
              value={imagensTexto}
              onChange={(e) => setImagensTexto(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/produtos")}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
