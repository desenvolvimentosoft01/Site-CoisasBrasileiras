"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"

export function BotaoFavoritar({
  produtoId,
  logado,
  favoritadoInicial,
}: {
  produtoId: string
  logado: boolean
  favoritadoInicial: boolean
}) {
  const router = useRouter()
  const [favoritado, setFavoritado] = useState(favoritadoInicial)
  const [carregando, setCarregando] = useState(false)

  async function alternar() {
    if (!logado) {
      router.push(`/entrar?voltar=/produtos`)
      return
    }

    setCarregando(true)
    if (favoritado) {
      await fetch(`/api/cliente/lista-desejos/${produtoId}`, { method: "DELETE" })
      setFavoritado(false)
    } else {
      await fetch("/api/cliente/lista-desejos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId }),
      })
      setFavoritado(true)
    }
    setCarregando(false)
  }

  return (
    <button
      onClick={alternar}
      disabled={carregando}
      aria-label={favoritado ? "Remover da lista de desejos" : "Adicionar a lista de desejos"}
      className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-60"
    >
      <Heart size={16} className={favoritado ? "fill-red-500 text-red-500" : ""} />
      {favoritado ? "Na lista de desejos" : "Adicionar a lista de desejos"}
    </button>
  )
}
