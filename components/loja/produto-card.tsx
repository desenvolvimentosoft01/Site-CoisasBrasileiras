"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ShoppingBag, Heart, Check } from "lucide-react"
import { useCarrinho } from "@/lib/carrinho-store"

type Produto = {
  id: string
  nome: string
  slug: string
  preco: string
  preco_promocional: string | null
  imagem_capa: string | null
  estoque?: number
}

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProdutoCard({
  produto,
  favoritadoInicial = false,
  logado = false,
}: {
  produto: Produto
  favoritadoInicial?: boolean
  logado?: boolean
}) {
  const router = useRouter()
  const adicionar = useCarrinho((s) => s.adicionar)
  const quantidadeNoCarrinho = useCarrinho(
    (s) => s.itens.find((i) => i.produtoId === produto.id)?.quantidade ?? 0
  )
  const [favoritado, setFavoritado] = useState(favoritadoInicial)
  const [favoritando, setFavoritando] = useState(false)
  const [adicionado, setAdicionado] = useState(false)

  const semEstoque = (produto.estoque ?? 1) <= 0
  const atingiuLimite = produto.estoque !== undefined && quantidadeNoCarrinho >= produto.estoque

  async function alternarFavorito(evento: React.MouseEvent) {
    evento.preventDefault()
    evento.stopPropagation()

    if (!logado) {
      router.push(`/entrar?voltar=/produtos`)
      return
    }

    setFavoritando(true)
    if (favoritado) {
      await fetch(`/api/cliente/lista-desejos/${produto.id}`, { method: "DELETE" })
      setFavoritado(false)
    } else {
      await fetch("/api/cliente/lista-desejos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: produto.id }),
      })
      setFavoritado(true)
    }
    setFavoritando(false)
  }

  function handleAdicionar(evento: React.MouseEvent) {
    evento.preventDefault()
    evento.stopPropagation()
    if (semEstoque || atingiuLimite) return

    adicionar(
      {
        produtoId: produto.id,
        nome: produto.nome,
        slug: produto.slug,
        preco: Number(produto.preco_promocional ?? produto.preco),
        imagemCapa: produto.imagem_capa,
        estoque: produto.estoque,
      },
      1
    )
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white transition-shadow hover:shadow-lg">
      <button
        onClick={alternarFavorito}
        disabled={favoritando}
        aria-label={favoritado ? "Remover da lista de desejos" : "Adicionar a lista de desejos"}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm transition-colors hover:text-red-500 disabled:opacity-60"
      >
        <Heart size={16} className={favoritado ? "fill-red-500 text-red-500" : ""} />
      </button>

      <Link href={`/produtos/${produto.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden bg-emerald-50">
          {produto.imagem_capa ? (
            <Image
              src={produto.imagem_capa}
              alt={produto.nome}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-emerald-300">
              <ShoppingBag size={40} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4 pb-2">
          <h3 className="font-heading text-sm font-medium text-neutral-800 line-clamp-2">
            {produto.nome}
          </h3>
          <div className="mt-auto pt-2">
            {produto.preco_promocional ? (
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-neutral-400 line-through">
                  {formatarPreco(produto.preco)}
                </span>
                <span className="font-semibold text-primary">
                  {formatarPreco(produto.preco_promocional)}
                </span>
              </div>
            ) : (
              <span className="font-semibold text-primary">
                {formatarPreco(produto.preco)}
              </span>
            )}
          </div>
          {produto.estoque !== undefined && (
            <p className="text-xs text-neutral-400">
              {semEstoque ? (
                <span className="text-red-500">Esgotado</span>
              ) : produto.estoque <= 5 ? (
                <span className="text-amber-600">Ultimas {produto.estoque} unidades</span>
              ) : (
                `${produto.estoque} em estoque`
              )}
            </p>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={handleAdicionar}
          disabled={semEstoque || atingiuLimite}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
        >
          {semEstoque ? (
            "Esgotado"
          ) : atingiuLimite ? (
            "Maximo no carrinho"
          ) : adicionado ? (
            <>
              <Check size={14} />
              Adicionado
            </>
          ) : (
            <>
              <ShoppingBag size={14} />
              Adicionar ao carrinho
            </>
          )}
        </button>
      </div>
    </div>
  )
}
