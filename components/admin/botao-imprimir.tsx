"use client"

import { useState } from "react"
import {  } from "lucide-react"
import { ModalImpressao, type CampoImpressao } from "@/components/admin/modal-impressao"
import { Icone } from "@/components/admin/icone"

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
        <Icone nome="imprimir" tamanho={16} />
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
