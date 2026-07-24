"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useAbasAdmin } from "@/lib/abas-admin-store"
import type { LucideIcon } from "lucide-react"

type ItemMenu = { href: string; label: string; icone: LucideIcon }

export function TabBarAdmin({ itensMenu }: { itensMenu: ItemMenu[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const { abas, abrirAba, fecharAba } = useAbasAdmin()
  const scrollRef = useRef<HTMLDivElement>(null)
  const conteudoRef = useRef<HTMLDivElement>(null)
  const [podeRolarEsquerda, setPodeRolarEsquerda] = useState(false)
  const [podeRolarDireita, setPodeRolarDireita] = useState(false)

  // Se o usuario chegou numa secao por link direto/F5 (nao pelo clique no
  // menu lateral), registra a aba mesmo assim - a barra sempre reflete onde
  // o usuario esta.
  useEffect(() => {
    const item = itensMenu.find((i) => pathname.startsWith(i.href))
    if (item) {
      abrirAba({ path: item.href, titulo: item.label })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Mostra/esconde as setas conforme o conteudo realmente ultrapassa a
  // largura visivel - recalcula a cada mudanca na lista de abas e no resize.
  const atualizarSetas = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setPodeRolarEsquerda(el.scrollLeft > 4)
    setPodeRolarDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    atualizarSetas()
    // Observa o wrapper interno do conteudo (que cresce livremente com as
    // abas), nao o container com overflow-x-auto - esse ultimo nunca muda de
    // tamanho quando o conteudo transborda, entao nunca dispararia o observer.
    const conteudo = conteudoRef.current
    if (!conteudo) return
    const observer = new ResizeObserver(atualizarSetas)
    observer.observe(conteudo)
    // O ResizeObserver acima nao cobre o redimensionamento da janela em si -
    // isso muda a largura visivel do container (clientWidth) sem mudar o
    // tamanho do conteudo observado.
    window.addEventListener("resize", atualizarSetas)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", atualizarSetas)
    }
  }, [abas, atualizarSetas])

  function rolar(direcao: -1 | 1) {
    scrollRef.current?.scrollBy({ left: direcao * 160, behavior: "smooth" })
  }

  function handleFechar(evento: React.MouseEvent, path: string) {
    evento.stopPropagation()
    const proximoPath = fecharAba(path)
    if (proximoPath && pathname.startsWith(path)) {
      router.push(proximoPath)
    }
  }

  function iconeDaAba(path: string) {
    return itensMenu.find((i) => i.href === path)?.icone
  }

  return (
    <div className="flex shrink-0 items-end border-b border-slate-700 bg-slate-800">
      <button
        onClick={() => rolar(-1)}
        disabled={!podeRolarEsquerda}
        aria-label="Rolar abas para a esquerda"
        className="flex h-8 w-7 shrink-0 items-center justify-center self-center text-slate-400 hover:bg-slate-700 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      <div
        ref={scrollRef}
        onScroll={atualizarSetas}
        className="min-w-0 shrink overflow-x-auto px-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
      <div ref={conteudoRef} className="flex w-max items-end gap-0">
      {abas.map((aba) => {
        const ativa = pathname.startsWith(aba.path)
        const Icone = iconeDaAba(aba.path)
        const fechavel = aba.path !== "/admin/dashboard"

        return (
          <div
            key={aba.path}
            role="button"
            tabIndex={0}
            onClick={() => router.push(aba.path)}
            onKeyDown={(e) => e.key === "Enter" && router.push(aba.path)}
            className={`group flex shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-t-md border-x border-t px-3 py-1.5 text-[12px] font-medium transition-all ${
              ativa
                ? "-mb-px border-slate-300 bg-slate-100 text-slate-800"
                : "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
            }`}
          >
            {Icone && <Icone size={13} />}
            <span className="whitespace-nowrap">{aba.titulo}</span>
            {fechavel && (
              <button
                onClick={(e) => handleFechar(e, aba.path)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors ${
                  ativa
                    ? "text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    : "text-slate-500 opacity-0 hover:bg-slate-500 hover:text-white group-hover:opacity-100"
                }`}
                aria-label={`Fechar aba ${aba.titulo}`}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            )}
          </div>
        )
      })}
      </div>
      </div>
      <button
        onClick={() => rolar(1)}
        disabled={!podeRolarDireita}
        aria-label="Rolar abas para a direita"
        className="flex h-8 w-7 shrink-0 items-center justify-center self-center text-slate-400 hover:bg-slate-700 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
