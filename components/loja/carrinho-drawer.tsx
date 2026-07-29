"use client"

import Image from "next/image"
import Link from "next/link"
import { X, ShoppingBag } from "lucide-react"
import { useCarrinho, totalCarrinho } from "@/lib/carrinho-store"
import { Button } from "@/components/ui/button"
import { SeletorQuantidade } from "@/components/loja/seletor-quantidade"

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function CarrinhoDrawer() {
  const { itens, aberto, fechar, remover, alterarQuantidade } = useCarrinho()

  if (!aberto) return null

  const total = totalCarrinho(itens)

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={fechar} />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Carrinho de compras
          </h2>
          <button
            onClick={fechar}
            aria-label="Fechar carrinho"
            className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={20} />
          </button>
        </div>

        {itens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-neutral-400">
            <ShoppingBag size={40} />
            <p className="text-sm">Seu carrinho esta vazio.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {itens.map((item) => (
              <div key={item.produtoId} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                  {item.imagemCapa && (
                    <Image src={item.imagemCapa} alt={item.nome} fill className="object-cover" />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-neutral-800 line-clamp-2">
                      {item.nome}
                    </span>
                    <button
                      onClick={() => remover(item.produtoId)}
                      className="shrink-0 rounded-full border border-neutral-200 p-0.5 text-neutral-400 transition-colors hover:border-red-300 hover:text-red-500"
                      aria-label="Remover item"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <SeletorQuantidade
                      quantidade={item.quantidade}
                      onChange={(nova) => alterarQuantidade(item.produtoId, nova)}
                      max={item.estoque}
                      tamanho="sm"
                    />
                    <span className="text-sm font-semibold text-primary">
                      {formatarPreco(item.preco * item.quantidade)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {itens.length > 0 && (
          <div className="space-y-3 border-t border-black/5 px-5 py-4">
            <div className="flex items-center justify-between text-sm font-medium text-neutral-700">
              <span>Subtotal:</span>
              <span>{formatarPreco(total)}</span>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" size="lg" onClick={fechar}>
                Continuar comprando
              </Button>
              <Button
                className="w-full"
                size="lg"
                nativeButton={false}
                render={<Link href="/carrinho" onClick={fechar} />}
              >
                Ver carrinho
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
