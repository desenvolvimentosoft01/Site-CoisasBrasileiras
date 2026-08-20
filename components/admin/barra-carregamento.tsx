"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

// Barra fina de progresso sobre as abas, como no InMenteGestao.
//
// Existe porque a troca de tela no App Router mantem a tela ANTIGA na frente
// enquanto o servidor monta a nova: sem sinal nenhum, um clique que demora
// parece clique que nao funcionou, e a pessoa clica de novo.
//
// O App Router nao expoe eventos de navegacao, entao o comeco e marcado por
// quem navega (o menu e a barra de abas chamam `iniciar()`) e o fim e a
// mudanca de pathname - que so acontece quando a tela nova esta pronta.

const ContextoCarregamento = createContext<() => void>(() => {})

export function useIniciarCarregamento() {
  return useContext(ContextoCarregamento)
}

// Rede de seguranca: navegacao cancelada (link pra rota igual, erro no
// servidor) nunca muda o pathname, e a barra ficaria correndo pra sempre.
const TEMPO_MAXIMO_MS = 15_000

export function ProvedorCarregamento({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [carregando, setCarregando] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const iniciar = useCallback(() => {
    setCarregando(true)
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setCarregando(false), TEMPO_MAXIMO_MS)
  }, [])

  // Pathname mudou = a tela nova entrou, entao a barra sai. O setState vai
  // num timeout de 0 de proposito: chamar direto no efeito dispara render em
  // cascata (a regra react-hooks/set-state-in-effect existe por isso), e aqui
  // nao ha pressa nenhuma - e so apagar uma barra.
  useEffect(() => {
    const fim = setTimeout(() => setCarregando(false), 0)
    if (temporizador.current) clearTimeout(temporizador.current)
    return () => clearTimeout(fim)
  }, [pathname])

  return (
    <ContextoCarregamento.Provider value={iniciar}>
      {carregando && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent"
          role="status"
          aria-label="Carregando"
        >
          <div className="animar-progresso h-full w-1/3 bg-[var(--primary)]" />
        </div>
      )}
      {children}
    </ContextoCarregamento.Provider>
  )
}
