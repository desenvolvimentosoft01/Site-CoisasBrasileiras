"use client"

import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type CampoDetalhe = {
  label: string
  valor: ReactNode
}

export function ModalDetalhe({
  aberto,
  onOpenChange,
  titulo,
  campos,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: string
  campos: CampoDetalhe[]
}) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.label}>
              <dt className="text-xs font-medium text-slate-500">{campo.label}</dt>
              <dd className="text-sm text-slate-900">{campo.valor ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
