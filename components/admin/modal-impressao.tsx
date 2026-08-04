"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { imprimirPagina, type OrientacaoImpressao } from "@/lib/impressao"

export type CampoImpressao = { chave: string; rotulo: string }

export function ModalImpressao({
  aberto,
  onOpenChange,
  campos,
  descricaoPeriodo,
  onImprimir,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  campos?: CampoImpressao[]
  descricaoPeriodo?: string
  onImprimir: (opcoes: { camposOcultos: Record<string, boolean> }) => void
}) {
  const [orientacao, setOrientacao] = useState<OrientacaoImpressao>("retrato")
  const [marcados, setMarcados] = useState<Record<string, boolean>>(
    Object.fromEntries((campos ?? []).map((c) => [c.chave, true]))
  )

  function confirmar() {
    onOpenChange(false)
    const camposOcultos = Object.fromEntries(
      Object.entries(marcados).map(([chave, incluido]) => [chave, !incluido])
    )
    onImprimir({ camposOcultos })
    // Da tempo do DOM aplicar display:none nas secoes desmarcadas antes do print.
    setTimeout(() => imprimirPagina(orientacao), 150)
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Imprimir relatório</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {descricaoPeriodo ?? "O relatório sai com os filtros aplicados na tela."}
          </p>

          <div className="space-y-2">
            <Label>Orientação</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrientacao("retrato")}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${
                  orientacao === "retrato"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                Retrato
              </button>
              <button
                type="button"
                onClick={() => setOrientacao("paisagem")}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${
                  orientacao === "paisagem"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                Paisagem
              </button>
            </div>
          </div>

          {campos && campos.length > 0 && (
            <div className="space-y-2">
              <Label>Seções a incluir</Label>
              {campos.map((campo) => (
                <label key={campo.chave} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={marcados[campo.chave] ?? true}
                    onChange={(e) =>
                      setMarcados((m) => ({ ...m, [campo.chave]: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  {campo.rotulo}
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmar}>Imprimir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
