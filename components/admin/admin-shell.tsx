"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, Package, Tag, ShoppingCart, Menu, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SessaoAdmin } from "@/lib/auth"

const itensMenu = [
  { href: "/admin/dashboard", label: "Dashboard", icone: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icone: Package },
  { href: "/admin/categorias", label: "Categorias", icone: Tag },
  { href: "/admin/pedidos", label: "Pedidos", icone: ShoppingCart },
  { href: "/admin/configuracoes", label: "Configuracoes", icone: Settings },
]

export function AdminShell({
  sessao,
  children,
}: {
  sessao: SessaoAdmin
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarAberta, setSidebarAberta] = useState(false)

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/entrar")
    router.refresh()
  }

  const iniciais = sessao.nome
    .trim()
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      <aside
        className={`fixed z-40 flex h-screen w-64 flex-col border-r border-neutral-800 bg-neutral-900 transition-transform md:static md:translate-x-0 ${
          sidebarAberta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-neutral-800 px-6 py-5">
          <Image src="/logo.webp" alt="Coisas Brasileiras" width={40} height={40} />
          <div>
            <div className="text-lg font-semibold">Coisas Brasileiras</div>
            <div className="text-xs text-neutral-400">Painel Admin</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {itensMenu.map((item) => {
            const ativo = pathname.startsWith(item.href)
            const Icone = item.icone
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarAberta(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  ativo
                    ? "bg-emerald-600/20 text-emerald-400"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <Icone size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 border-t border-neutral-800 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold">
            {iniciais}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-sm font-medium">{sessao.nome}</div>
            <div className="truncate text-xs capitalize text-neutral-400">{sessao.papel}</div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-neutral-800 px-4 py-3 md:px-6">
          <button
            className="text-neutral-300 md:hidden"
            onClick={() => setSidebarAberta((v) => !v)}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
