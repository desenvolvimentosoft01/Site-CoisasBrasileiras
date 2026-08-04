"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type BannerSlide = {
  id: string
  titulo: string
  subtitulo: string | null
  link: string | null
  imagem_url: string | null
  cor_fundo: string
}

// Slides usados quando nenhum banner foi cadastrado no admin ainda, para o
// site nunca ficar com a home vazia.
const slidesPadrao: BannerSlide[] = [
  {
    id: "padrao-1",
    titulo: "Porcelanas e itens decorativos para sua casa",
    subtitulo: "Bowls, aparelhos de jantar e travessas com o toque brasileiro",
    link: "/produtos",
    imagem_url: null,
    cor_fundo: "from-emerald-700 to-emerald-900",
  },
  {
    id: "padrao-2",
    titulo: "Imagens religiosas para sua fé",
    subtitulo: "Nossa Senhora, Sagrada Família e Santos em porcelana",
    link: "/produtos",
    imagem_url: null,
    cor_fundo: "from-amber-700 to-amber-900",
  },
  {
    id: "padrao-3",
    titulo: "O presente perfeito para cada ocasião",
    subtitulo: "Presentes e perfumaria com frete para todo o Brasil",
    link: "/produtos",
    imagem_url: null,
    cor_fundo: "from-emerald-800 to-teal-900",
  },
]

export function HeroCarousel({ banners }: { banners: BannerSlide[] }) {
  const slides = banners.length > 0 ? banners : slidesPadrao
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(intervalo)
  }, [slides.length])

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
        {slides.map((slide) => (
          <Link
            key={slide.id}
            href={slide.link || "/produtos"}
            className={`relative flex h-72 w-full shrink-0 flex-col items-center justify-center gap-3 bg-gradient-to-br px-6 text-center text-white md:h-96 ${slide.cor_fundo}`}
          >
            {slide.imagem_url && (
              <Image
                src={slide.imagem_url}
                alt=""
                fill
                sizes="100vw"
                className="object-cover opacity-40"
                priority
              />
            )}
            <h1 className="font-heading relative max-w-2xl text-3xl font-semibold md:text-5xl">
              {slide.titulo}
            </h1>
            {slide.subtitulo && (
              <p className="relative max-w-lg text-emerald-50/90 md:text-lg">{slide.subtitulo}</p>
            )}
          </Link>
        ))}
      </div>

      {slides.length > 1 && (
        <>
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
            aria-label="Próximo"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setIndice(i)}
                className={`h-2 rounded-full transition-all ${
                  i === indice ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
