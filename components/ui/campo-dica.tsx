"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Icone de "?" ao lado do rotulo de um campo - clica e mostra o texto de
// ajuda num balao, em vez do texto ficar sempre visivel embaixo do campo
// (que quebra o alinhamento da grade quando o texto e mais longo que os
// campos vizinhos).
export function CampoDica({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground",
          className
        )}
      >
        <HelpCircle size={14} />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={6} align="start">
          <PopoverPrimitive.Popup className="z-50 max-w-64 rounded-lg bg-popover p-3 text-xs text-popover-foreground ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
