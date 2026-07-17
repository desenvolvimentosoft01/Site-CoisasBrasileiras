"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Menu,
  LogOut,
  Settings,
  Image as ImageIcon,
  BarChart3,
  Percent,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SessaoAdmin } from "@/lib/auth"

const itensMenu = [
  { href: "/admin/dashboard", label: "Dashboard", icone: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icone: Package },
  { href: "/admin/categorias", label: "Categorias", icone: Tag },
  { href: "/admin/pedidos", label: "Pedidos", icone: ShoppingCart },
  { href: "/admin/cupons", label: "Cupons", icone: Percent },
  { href: "/admin/relatorios", label: "Relatorios", icone: BarChart3 },
  { href: "/admin/banners", label: "Banners", icone: ImageIcon },
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

  const paginaAtual = itensMenu.find((item) => pathname.startsWith(item.href))

  return (
    // Ativa o modo escuro de verdade do design system (classe "dark", nao so
    // um fundo escuro manual) - assim Card/Dialog/Input/Button seguem os
    // tokens corretos em vez de renderizar como se estivessem no tema claro.
    // A cor primaria tambem ganha um verde mais vivo, exclusivo do admin
    // (nao interfere na cor customizavel do site publico).
    <div
      className="dark flex min-h-screen bg-background text-foreground"
      style={{ "--primary": "oklch(0.72 0.19 149)", "--primary-foreground": "oklch(0.15 0.03 149)" } as React.CSSProperties}
    >
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      <aside
        className={`fixed z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar transition-transform md:static md:translate-x-0 ${
          sidebarAberta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <Image src="/logo.webp" alt="Coisas Brasileiras" width={40} height={40} />
          <div>
            <div className="text-lg font-semibold">Coisas Brasileiras</div>
            <div className="text-xs text-muted-foreground">Painel Admin</div>
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
                className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  ativo
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {ativo && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icone size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 border-t border-border px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {iniciais}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-sm font-medium">{sessao.nome}</div>
            <div className="truncate text-xs capitalize text-muted-foreground">{sessao.papel}</div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
          <button
            className="text-muted-foreground md:hidden"
            onClick={() => setSidebarAberta((v) => !v)}
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1 text-sm font-medium text-foreground">
            {paginaAtual?.label}
          </div>
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
