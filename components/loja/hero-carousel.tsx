"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Slide = {
  titulo: string
  subtitulo: string
  href: string
  corDeFundo: string
}

const slides: Slide[] = [
  {
    titulo: "Porcelanas e itens decorativos para sua casa",
    subtitulo: "Bowls, aparelhos de jantar e travessas com o toque brasileiro",
    href: "/produtos",
    corDeFundo: "from-emerald-700 to-emerald-900",
  },
  {
    titulo: "Imagens religiosas para sua fé",
    subtitulo: "Nossa Senhora, Sagrada Família e Santos em porcelana",
    href: "/produtos",
    corDeFundo: "from-amber-700 to-amber-900",
  },
  {
    titulo: "O presente perfeito para cada ocasião",
    subtitulo: "Presentes e perfumaria com frete para todo o Brasil",
    href: "/produtos",
    corDeFundo: "from-emerald-800 to-teal-900",
  },
]

export function HeroCarousel() {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(intervalo)
  }, [])

  function anterior() {
    setIndice((i) => (i - 1 + slides.length) % slides.length)
  }

  function proximo() {
    setIndice((i) => (i + 1) % slides.length)
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${indice * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <Link
            key={i}
            href={slide.href}
            className={`flex h-72 w-full shrink-0 flex-col items-center justify-center gap-3 bg-gradient-to-br px-6 text-center text-white md:h-96 ${slide.corDeFundo}`}
          >
            <h1 className="font-heading max-w-2xl text-3xl font-semibold md:text-5xl">
              {slide.titulo}
            </h1>
            <p className="max-w-lg text-emerald-50/90 md:text-lg">{slide.subtitulo}</p>
          </Link>
        ))}
      </div>

      <button
        onClick={anterior}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/30"
        aria-label="Anterior"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={proximo}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-white/30"
        aria-label="Proximo"
      >
        <ChevronRight size={22} />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndice(i)}
            className={`h-2 rounded-full transition-all ${
              i === indice ? "w-6 bg-white" : "w-2 bg-white/50"
            }`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
