"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  inputMode,
  onFocus,
  onKeyDown,
  ...props
}: React.ComponentProps<"input">) {
  const ehNumerico = type === "number" || inputMode === "numeric" || inputMode === "decimal"

  // Campos numericos (type="number" ou mascaras de moeda/CEP/telefone com
  // inputMode numeric) selecionam o valor inteiro ao focar, para digitar
  // substituir o "0"/valor atual em vez de precisar apagar na mao primeiro.
  function handleFocus(evento: React.FocusEvent<HTMLInputElement>) {
    if (ehNumerico) {
      evento.target.select()
    }
    onFocus?.(evento)
  }

  // O type="number" do navegador ainda deixa digitar "e", "E", "+" e "-"
  // (notacao cientifica/sinal), o que suja o campo e vira NaN ao salvar.
  // Nenhum campo numerico do sistema aceita negativo ou expoente, entao
  // bloqueia essas teclas na origem.
  function handleKeyDown(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (ehNumerico && ["e", "E", "+", "-"].includes(evento.key)) {
      evento.preventDefault()
    }
    onKeyDown?.(evento)
  }

  return (
    <InputPrimitive
      type={type}
      inputMode={inputMode}
      data-slot="input"
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
