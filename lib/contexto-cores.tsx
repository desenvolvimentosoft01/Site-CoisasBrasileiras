"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Guarda as cores do tema em estado compartilhado (nao so no formulario de
// /admin/cores) pra que mudar um seletor reflita na hora em qualquer parte
// da tela do admin (sidebar, botoes) - sem isso, cada componente teria sua
// propria copia das cores e so o preview local dentro do formulario mudaria.
type CoresContexto = {
  cores: Record<string, string>
  setCores: (cores: Record<string, string>) => void
}

const Contexto = createContext<CoresContexto | null>(null)

export function ProvedorCores({
  coresIniciais,
  children,
}: {
  coresIniciais: Record<string, string>
  children: ReactNode
}) {
  const [cores, setCores] = useState(coresIniciais)
  return <Contexto.Provider value={{ cores, setCores }}>{children}</Contexto.Provider>
}

export function useCoresTema() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error("useCoresTema precisa estar dentro de <ProvedorCores>")
  return contexto
}
