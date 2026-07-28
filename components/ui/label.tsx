"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        // min-h-5 reserva a altura de uma linha - garante que todos os rotulos
        // de uma mesma grade tenham a mesma altura, alinhando os campos abaixo
        // deles. Rotulos devem ser curtos o bastante pra caber em 1 linha (o
        // texto explicativo longo vai no <CampoDica>, nao no rotulo).
        "flex min-h-5 items-center gap-2 text-sm leading-tight font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
