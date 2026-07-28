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

type OpcoesConfirmacao = {
  titulo?: string
  descricao: string
  textoConfirmar?: string
  destrutivo?: boolean
}

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
            <AlertDialogTitle>{opcoes?.titulo ?? "Confirmar acao"}</AlertDialogTitle>
            <AlertDialogDescription>{opcoes?.descricao}</AlertDialogDescription>
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
