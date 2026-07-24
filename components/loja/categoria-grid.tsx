import Image from "next/image"
import Link from "next/link"
import { Leaf } from "lucide-react"

type Categoria = { id: string; nome: string; slug: string; imagem_url?: string | null }

export function CategoriaGrid({ categorias }: { categorias: Categoria[] }) {
  if (categorias.length === 0) return null

  return (
    <section id="categorias" className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h2 className="font-heading mb-6 text-2xl font-semibold text-emerald-950">
        Navegue por categoria
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {categorias.map((categoria) => (
          <Link
            key={categoria.id}
            href={`/produtos?categoria=${categoria.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-black/5 bg-emerald-50/60 p-6 text-center transition-colors hover:bg-emerald-100"
          >
            {categoria.imagem_url ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-full transition-transform group-hover:scale-105">
                <Image src={categoria.imagem_url} alt="" fill className="object-cover" sizes="48px" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition-transform group-hover:scale-105">
                <Leaf size={22} />
              </div>
            )}
            <span className="text-sm font-medium text-emerald-900">{categoria.nome}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
