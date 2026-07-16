"use client"

import Image from "next/image"
import Link from "next/link"
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useCarrinho, totalCarrinho } from "@/lib/carrinho-store"
import { Button } from "@/components/ui/button"

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
          <h2 className="font-heading text-lg font-semibold text-emerald-950">
            Seu carrinho
          </h2>
          <button onClick={fechar} aria-label="Fechar carrinho" className="text-neutral-500">
            <X size={22} />
          </button>
        </div>

        {itens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-neutral-400">
            <ShoppingBag size={40} />
            <p className="text-sm">Seu carrinho esta vazio.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {itens.map((item) => (
              <div key={item.produtoId} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-emerald-50">
                  {item.imagemCapa && (
                    <Image src={item.imagemCapa} alt={item.nome} fill className="object-cover" />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium text-neutral-800 line-clamp-2">
                    {item.nome}
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">
                    {formatarPreco(item.preco)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alterarQuantidade(item.produtoId, item.quantidade - 1)}
                      className="rounded-full border border-neutral-300 p-1 text-neutral-600"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantidade}</span>
                    <button
                      onClick={() => alterarQuantidade(item.produtoId, item.quantidade + 1)}
                      className="rounded-full border border-neutral-300 p-1 text-neutral-600"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => remover(item.produtoId)}
                      className="ml-auto text-neutral-400 hover:text-red-500"
                      aria-label="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {itens.length > 0 && (
          <div className="space-y-3 border-t border-black/5 px-5 py-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total</span>
              <span className="text-lg font-semibold text-emerald-700">
                {formatarPreco(total)}
              </span>
            </div>
            <Button
              className="w-full"
              size="lg"
              nativeButton={false}
              render={<Link href="/checkout" onClick={fechar} />}
            >
              Finalizar compra
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
