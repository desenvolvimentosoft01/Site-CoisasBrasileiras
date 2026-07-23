"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { X } from "lucide-react"
import { useAbasAdmin } from "@/lib/abas-admin-store"
import type { LucideIcon } from "lucide-react"

type ItemMenu = { href: string; label: string; icone: LucideIcon }

export function TabBarAdmin({ itensMenu }: { itensMenu: ItemMenu[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const { abas, abrirAba, fecharAba } = useAbasAdmin()

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
    <div className="flex shrink-0 items-end gap-0 overflow-x-auto border-b border-slate-700 bg-slate-800 px-2 pt-1">
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
  )
}
