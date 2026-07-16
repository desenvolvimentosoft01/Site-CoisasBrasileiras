"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Search, ShoppingCart, X } from "lucide-react"
import { useCarrinho } from "@/lib/carrinho-store"

const linksNav = [
  { href: "/produtos", label: "Todos os produtos" },
  { href: "/#categorias", label: "Categorias" },
  { href: "/#destaques", label: "Destaques" },
]

export function Header() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [montado, setMontado] = useState(false)
  const itens = useCarrinho((s) => s.itens)
  const abrirCarrinho = useCarrinho((s) => s.abrir)
  const totalItens = itens.reduce((soma, i) => soma + i.quantidade, 0)

  // Evita mismatch de hidratacao: o total vindo do localStorage (persist do
  // zustand) so existe no client, entao so mostramos o contador apos montar.
  useEffect(() => setMontado(true), [])

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.webp" alt="Coisas Brasileiras" width={44} height={44} priority />
          <span className="font-heading text-lg font-semibold text-emerald-900">
            Coisas Brasileiras
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {linksNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-700 transition-colors hover:text-emerald-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/produtos"
            className="rounded-full p-2 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Buscar produtos"
          >
            <Search size={22} />
          </Link>
          <button
            className="relative rounded-full p-2 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Carrinho"
            onClick={abrirCarrinho}
          >
            <ShoppingCart size={22} />
            {montado && totalItens > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
                {totalItens}
              </span>
            )}
          </button>
          <button
            className="rounded-full p-2 text-neutral-700 hover:bg-emerald-50 md:hidden"
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Menu"
          >
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav className="flex flex-col gap-1 border-t border-black/5 bg-white px-4 py-3 md:hidden">
          {linksNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuAberto(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-emerald-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
