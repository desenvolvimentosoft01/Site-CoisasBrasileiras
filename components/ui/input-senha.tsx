"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Input de senha com olhinho pra alternar entre mostrar/ocultar o valor
// digitado - mesmo comportamento em qualquer form do site (loja e admin).
function InputSenha({ className, ...props }: React.ComponentProps<"input">) {
  const [visivel, setVisivel] = React.useState(false)

  return (
    <div className="relative">
      <Input type={visivel ? "text" : "password"} className={cn("pr-8", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        tabIndex={-1}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground"
      >
        {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export { InputSenha }
