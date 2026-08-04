"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, ShoppingBag } from "lucide-react"
import { useCarrinho, totalCarrinho } from "@/lib/carrinho-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AplicarCupom } from "@/components/loja/aplicar-cupom"
import { SeletorQuantidade } from "@/components/loja/seletor-quantidade"

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function CarrinhoPage() {
  const { itens, remover, alterarQuantidade, cupom } = useCarrinho()
  const [valorFrete, setValorFrete] = useState(0)
  const [freteGratisAcimaDe, setFreteGratisAcimaDe] = useState(0)

  const subtotal = totalCarrinho(itens)
  const desconto = cupom?.desconto ?? 0
  const total = subtotal + valorFrete - desconto

  useEffect(() => {
    fetch(`/api/frete?subtotal=${subtotal}`)
      .then((r) => r.json())
      .then((dados) => {
        setValorFrete(dados.valorFrete)
        setFreteGratisAcimaDe(dados.freteGratisAcimaDe)
      })
  }, [subtotal])

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShoppingBag size={40} className="mx-auto mb-4 text-neutral-300" />
        <h1 className="font-heading mb-3 text-2xl font-semibold text-emerald-950">
          Seu carrinho está vazio
        </h1>
        <Button nativeButton={false} render={<Link href="/produtos" />}>
          Ver produtos
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-heading mb-8 text-3xl font-semibold text-emerald-950">
        Carrinho de compras
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardContent className="p-0">
            {/* Cabecalho da tabela - some no mobile, os itens viram cards empilhados */}
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-black/5 px-5 py-3 text-xs font-medium uppercase text-neutral-400 sm:grid">
              <span>Produto</span>
              <span>Preço</span>
              <span>Quantidade</span>
              <span className="text-right">Subtotal</span>
            </div>

            <div className="divide-y divide-black/5">
              {itens.map((item) => (
                <div
                  key={item.produtoId}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => remover(item.produtoId)}
                      className="shrink-0 rounded-full border border-neutral-200 p-1 text-neutral-400 transition-colors hover:border-red-300 hover:text-red-500"
                      aria-label="Remover item"
                    >
                      <X size={14} />
                    </button>
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                      {item.imagemCapa && (
                        <Image src={item.imagemCapa} alt={item.nome} fill className="object-cover" />
                      )}
                    </div>
                    <Link
                      href={`/produtos/${item.slug}`}
                      className="text-sm font-medium text-neutral-800 hover:text-primary"
                    >
                      {item.nome}
                    </Link>
                  </div>

                  <span className="hidden text-sm text-neutral-600 sm:block">
                    {formatarPreco(item.preco)}
                  </span>

                  <SeletorQuantidade
                    quantidade={item.quantidade}
                    onChange={(nova) => alterarQuantidade(item.produtoId, nova)}
                    max={item.estoque}
                    tamanho="sm"
                  />

                  <span className="text-right text-sm font-semibold text-primary sm:col-start-4">
                    {formatarPreco(item.preco * item.quantidade)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-black/5 p-5">
              <AplicarCupom subtotal={subtotal} />
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-heading text-lg font-semibold text-emerald-950">
              Total no carrinho
            </h2>

            <div className="space-y-2 border-t border-black/5 pt-4 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatarPreco(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Frete</span>
                <span>{valorFrete === 0 ? "Grátis" : formatarPreco(valorFrete)}</span>
              </div>
              {freteGratisAcimaDe > 0 && valorFrete > 0 && (
                <p className="text-xs text-primary">
                  Frete grátis em compras acima de {formatarPreco(freteGratisAcimaDe)}
                </p>
              )}
              {cupom && (
                <div className="flex justify-between text-primary">
                  <span>Desconto ({cupom.codigo})</span>
                  <span>-{formatarPreco(desconto)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between border-t border-black/5 pt-4 text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatarPreco(total)}</span>
            </div>

            <Button size="lg" className="w-full" nativeButton={false} render={<Link href="/checkout" />}>
              Continuar para a finalização de compra
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
