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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{titulo}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.label}>
              <dt className="text-sm font-medium text-slate-500">{campo.label}</dt>
              <dd className="text-base text-slate-900">{campo.valor ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
