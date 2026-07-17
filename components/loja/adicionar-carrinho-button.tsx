"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingBag, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCarrinho } from "@/lib/carrinho-store"

type Props = {
  produtoId: string
  nome: string
  slug: string
  preco: number
  imagemCapa: string | null
  estoque: number
}

export function AdicionarCarrinhoButton({
  produtoId,
  nome,
  slug,
  preco,
  imagemCapa,
  estoque,
}: Props) {
  const adicionar = useCarrinho((s) => s.adicionar)
  const [quantidade, setQuantidade] = useState(1)
  const [adicionado, setAdicionado] = useState(false)

  const semEstoque = estoque <= 0

  function handleAdicionar() {
    adicionar({ produtoId, nome, slug, preco, imagemCapa }, quantidade)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  if (semEstoque) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Fora de estoque
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-neutral-200 bg-white shadow-sm">
        <button
          onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary"
          aria-label="Diminuir quantidade"
        >
          <Minus size={16} />
        </button>
        <span className="w-8 text-center text-sm font-medium">{quantidade}</span>
        <button
          onClick={() => setQuantidade((q) => Math.min(estoque, q + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary"
          aria-label="Aumentar quantidade"
        >
          <Plus size={16} />
        </button>
      </div>

      <Button size="lg" onClick={handleAdicionar} className="flex-1 shadow-sm sm:flex-none">
        {adicionado ? (
          <>
            <Check size={18} className="mr-2" />
            Adicionado
          </>
        ) : (
          <>
            <ShoppingBag size={18} className="mr-2" />
            Adicionar ao carrinho
          </>
        )}
      </Button>
    </div>
  )
}
