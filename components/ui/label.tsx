"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        // min-h-9 reserva espaco pra ate 2 linhas de texto - sem isso, um
        // rotulo mais longo que quebra linha (ex: "Codigo de barras
        // (GTIN/EAN-13) *") fica mais alto que os rotulos vizinhos na mesma
        // grade, e o campo abaixo dele comeca mais embaixo, desalinhando a
        // linha inteira (bug reportado pelo cliente).
        "flex min-h-9 items-center gap-2 text-sm leading-tight font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
