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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MOTIVOS_AJUSTE_MANUAL, ROTULO_MOTIVO, type MotivoMovimento } from "@/lib/estoque-movimento"

// Pergunta o MOTIVO antes de gravar o ajuste. Sem isso, o histórico registra
// que o saldo caiu de 40 para 12 e não registra o que interessa: se foi
// quebra, furto ou contagem. Um ajuste sem motivo é o buraco que o kardex
// existe para fechar.
export function ModalAjusteEstoque({
  produto,
  onFechar,
  onConfirmar,
  salvando,
}: {
  produto: { id: string; nome: string; estoque: number; novoEstoque: number } | null
  onFechar: () => void
  onConfirmar: (motivo: MotivoMovimento, observacao: string) => void
  salvando: boolean
}) {
  const [motivo, setMotivo] = useState<MotivoMovimento>("inventario")
  const [observacao, setObservacao] = useState("")

  if (!produto) return null

  const diferenca = produto.novoEstoque - produto.estoque

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar estoque</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            <p className="font-medium">{produto.nome}</p>
            <p className="mt-1 text-slate-600">
              {produto.estoque} → <strong>{produto.novoEstoque}</strong>{" "}
              <span className={diferenca > 0 ? "text-emerald-600" : "text-red-600"}>
                ({diferenca > 0 ? "+" : ""}
                {diferenca})
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Motivo do ajuste</Label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoMovimento)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              autoFocus
            >
              {MOTIVOS_AJUSTE_MANUAL.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {ROTULO_MOTIVO[opcao]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: contagem do dia 20, caixa danificada na entrega"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirmar(motivo, observacao)} disabled={salvando}>
            {salvando ? "Salvando..." : "Confirmar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
