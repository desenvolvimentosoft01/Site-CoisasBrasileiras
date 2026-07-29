"use client"

import { Minus, Plus } from "lucide-react"

export function SeletorQuantidade({
  quantidade,
  onChange,
  max,
  tamanho = "md",
}: {
  quantidade: number
  onChange: (nova: number) => void
  max?: number
  tamanho?: "sm" | "md"
}) {
  const botao = tamanho === "sm" ? "h-8 w-8" : "h-11 w-11"
  const icone = tamanho === "sm" ? 14 : 16
  const noLimite = max !== undefined && quantidade >= max

  return (
    <div className="flex items-center rounded-full border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantidade - 1))}
        className={`flex ${botao} items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary`}
        aria-label="Diminuir quantidade"
      >
        <Minus size={icone} />
      </button>
      <span className="w-7 text-center text-sm font-medium">{quantidade}</span>
      <button
        type="button"
        onClick={() => onChange(max ? Math.min(max, quantidade + 1) : quantidade + 1)}
        disabled={noLimite}
        className={`flex ${botao} items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary disabled:pointer-events-none disabled:opacity-40`}
        aria-label="Aumentar quantidade"
      >
        <Plus size={icone} />
      </button>
    </div>
  )
}
