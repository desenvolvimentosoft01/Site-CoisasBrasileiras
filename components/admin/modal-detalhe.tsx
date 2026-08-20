"use client"

import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icone } from "@/components/admin/icone"

export type CampoDetalhe = {
  label: string
  valor: ReactNode
}

// Navegacao entre os registros da grade sem fechar o modal, como no
// InMenteGestao: conferir dez cadastros seguidos vira dez cliques na seta, e
// nao dez ciclos de abrir/fechar. Opcional - tela que mostra um registro
// avulso (uma nota, um pedido) simplesmente nao passa isso.
export type NavegacaoDetalhe = {
  posicao: number
  total: number
  aoAnterior: () => void
  aoProximo: () => void
}

export function ModalDetalhe({
  aberto,
  onOpenChange,
  titulo,
  campos,
  navegacao,
  aoEditar,
  selo,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: string
  campos: CampoDetalhe[]
  navegacao?: NavegacaoDetalhe
  // Quando existe, o modal ganha "Editar" no rodape - o caminho natural depois
  // de olhar um registro e querer corrigi-lo.
  aoEditar?: () => void
  // Selo de estado ao lado do titulo (Ativo/Inativo, situacao do documento).
  selo?: ReactNode
}) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            {navegacao && navegacao.total > 1 && (
              <div className="flex shrink-0 items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={navegacao.aoAnterior}
                  disabled={navegacao.posicao <= 1}
                  aria-label="Registro anterior"
                  className="rounded-r-none"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={navegacao.aoProximo}
                  disabled={navegacao.posicao >= navegacao.total}
                  aria-label="Próximo registro"
                  className="-ml-px rounded-l-none"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
            <DialogTitle className="text-xl">{titulo}</DialogTitle>
            {selo}
          </div>
          {navegacao && navegacao.total > 1 && (
            <p className="text-xs text-slate-400">
              {navegacao.posicao} de {navegacao.total}
            </p>
          )}
        </DialogHeader>

        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {campo.label}
              </dt>
              <dd className="text-base text-slate-900">{campo.valor ?? "-"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {aoEditar && (
            <Button onClick={aoEditar}>
              <Icone nome="editar" tamanho={15} className="mr-1.5" />
              Editar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
