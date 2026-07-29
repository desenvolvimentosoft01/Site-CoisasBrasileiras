"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCarrinho } from "@/lib/carrinho-store"
import { SeletorQuantidade } from "@/components/loja/seletor-quantidade"

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
  const router = useRouter()
  const [quantidade, setQuantidade] = useState(1)
  const [adicionado, setAdicionado] = useState(false)

  const semEstoque = estoque <= 0

  function handleAdicionar() {
    adicionar({ produtoId, nome, slug, preco, imagemCapa, estoque }, quantidade)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  function handleComprarAgora() {
    adicionar({ produtoId, nome, slug, preco, imagemCapa, estoque }, quantidade)
    router.push("/checkout")
  }

  if (semEstoque) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Fora de estoque
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500">
        {estoque <= 5 ? (
          <span className="font-medium text-amber-600">Ultimas {estoque} unidades em estoque</span>
        ) : (
          `${estoque} em estoque`
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SeletorQuantidade quantidade={quantidade} onChange={setQuantidade} max={estoque} />

        <Button
          size="lg"
          variant="outline"
          onClick={handleAdicionar}
          className="flex-1 shadow-sm sm:flex-none"
        >
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

        <Button size="lg" onClick={handleComprarAgora} className="flex-1 shadow-sm sm:flex-none">
          Comprar agora
        </Button>
      </div>
    </div>
  )
}
