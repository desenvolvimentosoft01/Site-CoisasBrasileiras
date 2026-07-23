"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Menu,
  LogOut,
  Settings,
  BarChart3,
  Percent,
  Users,
  Store,
  Wallet,
  ChevronDown,
  ChevronRight,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TabBarAdmin } from "@/components/admin/tab-bar"
import type { SessaoAdmin } from "@/lib/auth"
import type { LucideIcon } from "lucide-react"

type ItemLink = { tipo: "link"; href: string; label: string; icone: LucideIcon; somenteAdmin?: boolean }
type ItemGrupo = {
  tipo: "grupo"
  label: string
  icone: LucideIcon
  filhos: { href: string; label: string; somenteAdmin?: boolean }[]
}
type ItemMenu = ItemLink | ItemGrupo

// Estrutura de menu igual ao InMenteGestao: itens soltos pras secoes mais
// usadas no dia a dia, agrupados em categorias colapsaveis pro resto.
const menu: ItemMenu[] = [
  { tipo: "link", href: "/admin/dashboard", label: "Dashboard", icone: LayoutDashboard },
  { tipo: "link", href: "/admin/venda-balcao", label: "Venda Balcao", icone: Store },
  { tipo: "link", href: "/admin/pedidos", label: "Pedidos", icone: ShoppingCart },
  { tipo: "link", href: "/admin/clientes", label: "Clientes", icone: Users },
  {
    tipo: "grupo",
    label: "Produtos",
    icone: Package,
    filhos: [
      { href: "/admin/produtos", label: "Cadastro de Produtos" },
      { href: "/admin/categorias", label: "Categorias" },
    ],
  },
  {
    tipo: "grupo",
    label: "Marketing",
    icone: Percent,
    filhos: [
      { href: "/admin/cupons", label: "Cupons" },
      { href: "/admin/banners", label: "Banners" },
    ],
  },
  { tipo: "link", href: "/admin/financeiro", label: "Financeiro", icone: Wallet, somenteAdmin: true },
  {
    tipo: "grupo",
    label: "Relatorios",
    icone: BarChart3,
    filhos: [
      { href: "/admin/relatorios", label: "Vendas" },
      { href: "/admin/auditoria", label: "Auditoria", somenteAdmin: true },
    ],
  },
  {
    tipo: "grupo",
    label: "Configuracoes",
    icone: Settings,
    filhos: [
      { href: "/admin/usuarios", label: "Usuarios", somenteAdmin: true },
      { href: "/admin/configuracoes", label: "Configuracoes da Loja" },
    ],
  },
]

// Achata o menu (so os itens visiveis pro papel da sessao) pra alimentar a
// TabBar e o breadcrumb, que trabalham com uma lista simples de {href, label}.
function itensVisiveis(papel: string): { href: string; label: string; icone: LucideIcon }[] {
  const resultado: { href: string; label: string; icone: LucideIcon }[] = []
  for (const item of menu) {
    if (item.tipo === "link") {
      if (!item.somenteAdmin || papel === "admin") resultado.push({ href: item.href, label: item.label, icone: item.icone })
    } else {
      for (const filho of item.filhos) {
        if (!filho.somenteAdmin || papel === "admin") {
          resultado.push({ href: filho.href, label: filho.label, icone: item.icone })
        }
      }
    }
  }
  return resultado
}

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

  const planoDeMenu = itensVisiveis(sessao.papel)

  // Abre automaticamente o grupo que contem a pagina atual, pra nao esconder
  // onde o usuario esta logo na primeira renderizacao.
  const [gruposAbertos, setGruposAbertos] = useState<string[]>(() =>
    menu
      .filter(
        (item): item is ItemGrupo =>
          item.tipo === "grupo" && item.filhos.some((f) => pathname.startsWith(f.href))
      )
      .map((item) => item.label)
  )

  function alternarGrupo(label: string) {
    setGruposAbertos((atual) => (atual.includes(label) ? atual.filter((g) => g !== label) : [...atual, label]))
  }

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

  const paginaAtual = planoDeMenu.find((item) => pathname.startsWith(item.href))

  // Breadcrumb simples a partir do path atual - so mostra a secao (nao
  // segmenta por UUID/subpaginas como o InMenteGestao, porque nossas rotas
  // de detalhe usam "/admin/pedidos/[id]" com um so nivel relevante).
  const migalhas = paginaAtual ? [{ href: paginaAtual.href, label: paginaAtual.label }] : []

  return (
    // Tema sempre claro, igual ao InMenteGestao (decisao deles: nao seguir o
    // tema escuro do SO do operador, evita variaveis de dark mode aplicadas
    // sem querer). "h-screen overflow-hidden" no shell inteiro + "min-h-0" no
    // <main> e o que garante que SO o conteudo rola - sem isso (como estava
    // antes, com "min-h-screen"), a pagina inteira crescia e a sidebar (que
    // tem altura fixa de tela) "acabava" no meio da rolagem, bagunçando o
    // layout.
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-56 shrink-0 flex-col bg-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarAberta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-4 py-5">
          <Image src="/logo.webp" alt="" width={32} height={32} className="shrink-0 rounded-lg" />
          <div>
            <p className="text-sm font-bold leading-tight text-white">Coisas Brasileiras</p>
            <p className="text-[10px] text-slate-400">Painel Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {menu.map((item) => {
            if (item.tipo === "link") {
              if (item.somenteAdmin && sessao.papel !== "admin") return null
              const Icone = item.icone
              const ativo = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarAberta(false)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                    ativo ? "bg-amber-500 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icone size={15} />
                  {item.label}
                </Link>
              )
            }

            const filhosVisiveis = item.filhos.filter((f) => !f.somenteAdmin || sessao.papel === "admin")
            if (filhosVisiveis.length === 0) return null

            const Icone = item.icone
            const aberto = gruposAbertos.includes(item.label)
            const grupoAtivo = filhosVisiveis.some((f) => pathname.startsWith(f.href))

            return (
              <div key={item.label}>
                <button
                  onClick={() => alternarGrupo(item.label)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                    grupoAtivo ? "text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icone size={15} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown size={12} className={`text-slate-500 transition-transform ${aberto ? "rotate-180" : ""}`} />
                </button>

                {aberto && (
                  <div className="mb-1 ml-6 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                    {filhosVisiveis.map((filho) => {
                      const ativo = pathname.startsWith(filho.href)
                      return (
                        <Link
                          key={filho.href}
                          href={filho.href}
                          onClick={() => setSidebarAberta(false)}
                          className={`block rounded-md px-2 py-1.5 text-left text-[12px] font-medium transition-all ${
                            ativo ? "bg-slate-800 text-amber-400" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                          }`}
                        >
                          {filho.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 border-t border-slate-800 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-white">
            {iniciais}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-sm font-medium text-white">{sessao.nome}</div>
            <div className="truncate text-xs capitalize text-slate-400">{sessao.papel}</div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6">
          <nav className="flex min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm">
            <button
              className="-ml-1 mr-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              onClick={() => setSidebarAberta((v) => !v)}
              aria-label="Menu"
            >
              <Menu size={18} />
            </button>
            <Link href="/admin/dashboard" className="text-slate-400 transition-colors hover:text-slate-600">
              <Home size={14} />
            </Link>
            {migalhas.map((m) => (
              <span key={m.href} className="flex items-center gap-1.5">
                <ChevronRight size={13} className="text-slate-300" />
                <span className="font-semibold text-slate-700">{m.label}</span>
              </span>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs font-semibold text-slate-500 sm:block">{sessao.nome}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </header>

        <TabBarAdmin itensMenu={planoDeMenu} />

        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
