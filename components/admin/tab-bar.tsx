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
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 pt-2">
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
            className={`group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-t-md border-x border-t px-3 py-2 text-sm transition-colors ${
              ativa
                ? "border-border bg-background text-foreground"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {ativa && (
              <span className="absolute inset-x-0 -top-[1px] h-0.5 rounded-full bg-primary" />
            )}
            {Icone && <Icone size={14} />}
            {aba.titulo}
            {fechavel && (
              <button
                onClick={(e) => handleFechar(e, aba.path)}
                className="rounded-full p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                aria-label={`Fechar aba ${aba.titulo}`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
