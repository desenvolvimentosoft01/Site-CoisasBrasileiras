"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, inputMode, onFocus, ...props }: React.ComponentProps<"input">) {
  // Campos numericos (type="number" ou mascaras de moeda/CEP/telefone com
  // inputMode numeric) selecionam o valor inteiro ao focar, para digitar
  // substituir o "0"/valor atual em vez de precisar apagar na mao primeiro.
  function handleFocus(evento: React.FocusEvent<HTMLInputElement>) {
    if (type === "number" || inputMode === "numeric") {
      evento.target.select()
    }
    onFocus?.(evento)
  }

  return (
    <InputPrimitive
      type={type}
      inputMode={inputMode}
      data-slot="input"
      onFocus={handleFocus}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
