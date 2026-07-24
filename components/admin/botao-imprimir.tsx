"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { ModalImpressao, type CampoImpressao } from "@/components/admin/modal-impressao"

export function BotaoImprimir({
  campos,
  descricaoPeriodo,
  onCamposOcultos,
  className,
}: {
  campos?: CampoImpressao[]
  descricaoPeriodo?: string
  onCamposOcultos?: (camposOcultos: Record<string, boolean>) => void
  className?: string
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className={`flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent print:hidden ${className ?? ""}`}
      >
        <Printer size={14} />
        Imprimir
      </button>
      <ModalImpressao
        aberto={aberto}
        onOpenChange={setAberto}
        campos={campos}
        descricaoPeriodo={descricaoPeriodo}
        onImprimir={({ camposOcultos }) => onCamposOcultos?.(camposOcultos)}
      />
    </>
  )
}
