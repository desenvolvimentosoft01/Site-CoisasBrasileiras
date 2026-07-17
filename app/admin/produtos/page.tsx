"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Produto = {
  id: string
  nome: string
  sku: string | null
  preco: string
  preco_promocional: string | null
  estoque: number
  estoque_minimo: number
  ativo: boolean
  categorias: string[]
}

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    setCarregando(true)
    const resposta = await fetch("/api/admin/produtos")
    const dados = await resposta.json()
    setProdutos(dados)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function excluir(produto: Produto) {
    if (!confirm(`Excluir o produto "${produto.nome}"?`)) return
    await fetch(`/api/admin/produtos/${produto.id}`, { method: "DELETE" })
    carregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Button nativeButton={false} render={<Link href="/admin/produtos/novo" />}>
          <Plus size={16} className="mr-2" />
          Novo produto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {carregando ? (
            <p className="p-6 text-sm text-neutral-400">Carregando...</p>
          ) : produtos.length === 0 ? (
            <p className="p-6 text-sm text-neutral-400">Nenhum produto cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-neutral-400">
                    <th className="p-4 font-medium">Nome</th>
                    <th className="p-4 font-medium">SKU</th>
                    <th className="p-4 font-medium">Categorias</th>
                    <th className="p-4 font-medium">Preco</th>
                    <th className="p-4 font-medium">Estoque</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="border-b border-neutral-800 last:border-0">
                      <td className="p-4">{produto.nome}</td>
                      <td className="p-4 text-neutral-400">{produto.sku || "-"}</td>
                      <td className="p-4 text-neutral-400">
                        {produto.categorias.length > 0 ? produto.categorias.join(", ") : "-"}
                      </td>
                      <td className="p-4">
                        {produto.preco_promocional ? (
                          <span>
                            <span className="text-neutral-500 line-through">
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
                              : "bg-neutral-700/40 text-neutral-400"
                          }`}
                        >
                          {produto.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          nativeButton={false}
                          render={<Link href={`/admin/produtos/${produto.id}`} />}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon-lg" onClick={() => excluir(produto)}>
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
    </div>
  )
}
