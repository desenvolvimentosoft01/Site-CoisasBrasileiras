import Link from "next/link"
import Image from "next/image"
import { ShoppingBag } from "lucide-react"

type Produto = {
  id: string
  nome: string
  slug: string
  preco: string
  preco_promocional: string | null
  imagem_capa: string | null
}

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProdutoCard({ produto }: { produto: Produto }) {
  return (
    <Link
      href={`/produtos/${produto.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white transition-shadow hover:shadow-lg"
    >
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

      <div className="flex flex-1 flex-col gap-1 p-4">
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
      </div>
    </Link>
  )
}
