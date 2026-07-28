"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, X, ShoppingBag } from "lucide-react"
import { formatarMoeda } from "@/lib/mascaras"

type ProdutoDesejado = {
  id: string
  nome: string
  slug: string
  preco: string
  preco_promocional: string | null
  estoque: number
  imagem_url: string | null
}

export default function FavoritosPage() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [produtos, setProdutos] = useState<ProdutoDesejado[]>([])

  useEffect(() => {
    fetch("/api/cliente/lista-desejos").then((r) => {
      if (!r.ok) {
        router.push("/entrar?voltar=/favoritos")
        return
      }
      r.json().then((dados) => {
        setProdutos(dados)
        setCarregando(false)
      })
    })
  }, [router])

  async function remover(produtoId: string) {
    setProdutos((atual) => atual.filter((p) => p.id !== produtoId))
    await fetch(`/api/cliente/lista-desejos/${produtoId}`, { method: "DELETE" })
  }

  if (carregando) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-neutral-500">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:px-6">
      <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold text-emerald-950">
        <Heart size={26} />
        Meus favoritos
      </h1>

      {produtos.length === 0 ? (
        <div className="rounded-lg border border-black/5 p-10 text-center text-neutral-500">
          <p>Voce ainda nao favoritou nenhum produto.</p>
          <Link href="/produtos" className="mt-3 inline-block text-primary underline">
            Ver catalogo
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {produtos.map((produto) => (
            <div
              key={produto.id}
              className="flex items-center gap-3 rounded-lg border border-black/5 bg-white p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-emerald-50">
                {produto.imagem_url ? (
                  <Image src={produto.imagem_url} alt={produto.nome} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-emerald-300">
                    <ShoppingBag size={22} />
                  </div>
                )}
              </div>
              <Link href={`/produtos/${produto.slug}`} className="flex-1 hover:underline">
                <p className="font-medium">{produto.nome}</p>
                <p className="text-sm text-neutral-500">
                  {formatarMoeda(produto.preco_promocional ?? produto.preco)}
                  {produto.estoque <= 0 && <span className="ml-2 text-red-500">Esgotado</span>}
                </p>
              </Link>
              <button
                onClick={() => remover(produto.id)}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                aria-label="Remover dos favoritos"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
