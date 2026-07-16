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
      <div className="flex items-center gap-2 rounded-lg border border-neutral-300 px-2 py-1">
        <button
          onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
          className="p-1 text-neutral-600"
          aria-label="Diminuir quantidade"
        >
          <Minus size={16} />
        </button>
        <span className="w-6 text-center text-sm">{quantidade}</span>
        <button
          onClick={() => setQuantidade((q) => Math.min(estoque, q + 1))}
          className="p-1 text-neutral-600"
          aria-label="Aumentar quantidade"
        >
          <Plus size={16} />
        </button>
      </div>

      <Button size="lg" onClick={handleAdicionar} className="flex-1 sm:flex-none">
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
