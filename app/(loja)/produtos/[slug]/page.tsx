import { query } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import { ShoppingBag, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [produto] = await query(
    "SELECT * FROM TAB_PRODUTO WHERE slug = $1 AND ativo = true",
    [slug]
  )
  if (!produto) notFound()

  const imagens = await query(
    "SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = $1 ORDER BY ordem",
    [produto.id]
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-emerald-50">
          {imagens.length > 0 ? (
            <Image src={imagens[0].url} alt={produto.nome} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-emerald-300">
              <ShoppingBag size={64} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-emerald-950">
              {produto.nome}
            </h1>

            <div className="mt-3">
              {produto.preco_promocional ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-lg text-neutral-400 line-through">
                    {formatarPreco(produto.preco)}
                  </span>
                  <span className="text-3xl font-semibold text-emerald-700">
                    {formatarPreco(produto.preco_promocional)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-semibold text-emerald-700">
                  {formatarPreco(produto.preco)}
                </span>
              )}
            </div>
          </div>

          {produto.descricao && (
            <p className="leading-relaxed text-neutral-600">{produto.descricao}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Truck size={18} />
            Envio para todo o Brasil
          </div>

          <Button size="lg" className="w-full sm:w-auto">
            <ShoppingBag size={18} className="mr-2" />
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </div>
  )
}
