"use client"

import { useState } from "react"
import Image from "next/image"
import { ShoppingBag } from "lucide-react"

export function ProdutoGaleria({ imagens, nome }: { imagens: string[]; nome: string }) {
  const [indice, setIndice] = useState(0)

  if (imagens.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-emerald-50 text-emerald-300">
        <ShoppingBag size={64} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-emerald-50">
        <Image src={imagens[indice]} alt={nome} fill className="object-cover" />
      </div>

      {imagens.length > 1 && (
        <div className="flex gap-2">
          {imagens.map((url, i) => (
            <button
              key={url}
              onClick={() => setIndice(i)}
              className={`relative h-16 w-16 overflow-hidden rounded-md border-2 transition-colors ${
                i === indice ? "border-emerald-600" : "border-transparent"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
