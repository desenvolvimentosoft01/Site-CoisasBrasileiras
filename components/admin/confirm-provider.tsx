"use client"

import { createContext, useCallback, useContext, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Icone } from "@/components/admin/icone"

type OpcoesConfirmacao = {
  titulo?: string
  descricao: string
  textoConfirmar?: string
  destrutivo?: boolean
  // O que acontece de fato ao confirmar - estorno de estoque, e-mail que sai,
  // registro que some. Quem clica precisa saber a consequencia ANTES, nao
  // descobrir depois; e a diferenca entre confirmar e adivinhar.
  consequencia?: string
  // O que acontece ao cancelar, quando nao e obvio ("o pedido continua como
  // esta"). Sem isso, cancelar tambem vira aposta.
  aoCancelar?: string
}

// Toda acao destrutiva sem consequencia propria cai neste aviso: e sempre
// verdade, e melhor repetir do que deixar a pessoa achar que da pra desfazer.
const AVISO_PADRAO_DESTRUTIVO = "Esta ação não pode ser desfeita."

type ConfirmarFn = (opcoes: OpcoesConfirmacao | string) => Promise<boolean>

const ConfirmContext = createContext<ConfirmarFn | null>(null)

// Substitui o confirm() nativo do navegador (feio, sem estilo, e alguns
// navegadores/extensoes bloqueiam) por um modal proprio. Fica montado uma
// unica vez no AdminShell; qualquer tela do admin chama useConfirmar() em
// vez de confirm(...).
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opcoes, setOpcoes] = useState<OpcoesConfirmacao | null>(null)
  const [resolver, setResolver] = useState<((valor: boolean) => void) | null>(null)

  const confirmar = useCallback<ConfirmarFn>((opcoesOuTexto) => {
    const normalizado = typeof opcoesOuTexto === "string" ? { descricao: opcoesOuTexto } : opcoesOuTexto
    setOpcoes(normalizado)
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  function fechar(resultado: boolean) {
    resolver?.(resultado)
    setOpcoes(null)
    setResolver(null)
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <AlertDialog open={opcoes !== null} onOpenChange={(aberto) => !aberto && fechar(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opcoes?.titulo ?? "Confirmar ação"}</AlertDialogTitle>
            <AlertDialogDescription>{opcoes?.descricao}</AlertDialogDescription>

            {(opcoes?.consequencia || opcoes?.destrutivo) && (
              <div
                className={`mt-3 rounded-md border px-3 py-2 text-left text-xs ${
                  opcoes?.destrutivo
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                <Icone
                  nome={opcoes?.destrutivo ? "bloquear" : "alerta"}
                  tamanho={14}
                  className="mr-1.5 inline-block align-text-bottom"
                />
                {opcoes?.consequencia ?? AVISO_PADRAO_DESTRUTIVO}
              </div>
            )}

            {opcoes?.aoCancelar && (
              <p className="mt-2 text-left text-xs text-slate-500">
                Se cancelar: {opcoes.aoCancelar}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => fechar(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fechar(true)}
              className={opcoes?.destrutivo ? "bg-red-600 text-white hover:bg-red-700" : undefined}
            >
              {opcoes?.textoConfirmar ?? "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirmar(): ConfirmarFn {
  const contexto = useContext(ConfirmContext)
  if (!contexto) {
    throw new Error("useConfirmar precisa estar dentro de ConfirmProvider")
  }
  return contexto
}
