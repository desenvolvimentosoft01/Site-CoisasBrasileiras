import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AbaAdmin = { path: string; titulo: string }

const ABA_INICIAL: AbaAdmin = { path: "/admin/dashboard", titulo: "Visao Geral" }

type AbasAdminState = {
  abas: AbaAdmin[]
  abrirAba: (aba: AbaAdmin) => void
  fecharAba: (path: string) => string | null
}

// Estado global das "abas de documento" abertas no admin (estilo MDI, igual
// ao in-mente-gestao) - o Dashboard e fixo (nao pode ser fechado) e sempre a
// primeira aba. A URL continua sendo a fonte da verdade da navegacao (F5,
// voltar do navegador etc. funcionam normalmente); a barra de abas so reflete
// o historico de secoes visitadas nesta sessao.
export const useAbasAdmin = create<AbasAdminState>()(
  persist(
    (set, get) => ({
      abas: [ABA_INICIAL],

      abrirAba: (aba) =>
        set((state) => {
          if (state.abas.some((a) => a.path === aba.path)) return state
          return { abas: [...state.abas, aba] }
        }),

      // Retorna o path pra onde navegar depois de fechar (se a aba fechada
      // era a ativa), ou null se nao precisa navegar.
      fecharAba: (path) => {
        if (path === ABA_INICIAL.path) return null

        const { abas } = get()
        const indice = abas.findIndex((a) => a.path === path)
        if (indice === -1) return null

        const novasAbas = abas.filter((a) => a.path !== path)
        set({ abas: novasAbas })

        const abaAnterior = novasAbas[Math.max(0, indice - 1)]
        return abaAnterior?.path ?? ABA_INICIAL.path
      },
    }),
    { name: "coisas-brasileiras-abas-admin" }
  )
)
