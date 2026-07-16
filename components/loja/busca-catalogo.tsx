"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function BuscaCatalogo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busca, setBusca] = useState(searchParams.get("busca") ?? "")

  function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()

    const params = new URLSearchParams(searchParams.toString())
    if (busca.trim()) {
      params.set("busca", busca.trim())
    } else {
      params.delete("busca")
    }

    router.push(`/produtos?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-8 max-w-md">
      <Search
        size={18}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400"
      />
      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produtos..."
        className="pl-10"
      />
    </form>
  )
}
