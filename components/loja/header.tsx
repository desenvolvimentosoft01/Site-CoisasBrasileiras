"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Heart, LayoutDashboard, Menu, Search, ShoppingCart, User, X } from "lucide-react"
import { useCarrinho } from "@/lib/carrinho-store"

type Categoria = { id: string; nome: string; slug: string; categoria_pai_id: string | null }

export function Header({
  nomeLoja = "Coisas Brasileiras",
  logoUrl,
  categorias = [],
}: {
  nomeLoja?: string
  logoUrl?: string
  categorias?: Categoria[]
}) {
  // So as categorias principais viram item de menu; as subcategorias aparecem
  // num dropdown embaixo do respectivo pai (quando existirem).
  const principais = categorias.filter((c) => !c.categoria_pai_id)
  const subcategoriasPorPai = (paiId: string) => categorias.filter((c) => c.categoria_pai_id === paiId)
  const [menuAberto, setMenuAberto] = useState(false)
  const [categoriasAbertas, setCategoriasAbertas] = useState(false)
  const [montado, setMontado] = useState(false)
  const [logado, setLogado] = useState(false)
  const itens = useCarrinho((s) => s.itens)
  const totalItens = itens.reduce((soma, i) => soma + i.quantidade, 0)

  // Evita mismatch de hidratacao: o total vindo do localStorage (persist do
  // zustand) so existe no client, entao so mostramos o contador apos montar.
  useEffect(() => {
    setMontado(true)
    fetch("/api/cliente/me").then((r) => setLogado(r.ok))
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src={logoUrl || "/logo.webp"} alt={nomeLoja} width={44} height={44} priority />
          <span className="font-heading text-lg font-semibold text-primary">
            {nomeLoja}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/produtos"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-primary"
          >
            Todos os produtos
          </Link>

          {principais.length > 0 && (
            <div
              className="group relative"
              onMouseEnter={() => setCategoriasAbertas(true)}
              onMouseLeave={() => setCategoriasAbertas(false)}
            >
              <button className="flex items-center gap-1 text-sm font-medium text-neutral-700 transition-colors hover:text-primary">
                Categorias
                <ChevronDown size={14} />
              </button>

              {categoriasAbertas && (
                <div className="absolute left-1/2 top-full flex -translate-x-1/2 gap-8 rounded-lg border border-black/5 bg-white p-5 shadow-lg">
                  {principais.map((categoria) => (
                    <div key={categoria.id} className="flex flex-col gap-1">
                      <Link
                        href={`/produtos?categoria=${categoria.slug}`}
                        className="whitespace-nowrap text-sm font-semibold text-emerald-950 hover:text-primary"
                      >
                        {categoria.nome}
                      </Link>
                      {subcategoriasPorPai(categoria.id).map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/produtos?categoria=${sub.slug}`}
                          className="whitespace-nowrap text-sm text-neutral-600 hover:text-primary"
                        >
                          {sub.nome}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link
            href="/#destaques"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-primary"
          >
            Destaques
          </Link>

          <Link
            href="/sobre"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-primary"
          >
            Sobre nós
          </Link>

          <Link
            href="/contato"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-primary"
          >
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/entrar"
            className="hidden rounded-full p-2 text-neutral-400 hover:bg-emerald-50 hover:text-primary md:block"
            aria-label="Área administrativa"
            title="Área administrativa"
          >
            <LayoutDashboard size={20} />
          </Link>
          <Link
            href="/produtos"
            className="rounded-full p-2 text-neutral-700 hover:bg-emerald-50 hover:text-primary"
            aria-label="Buscar produtos"
          >
            <Search size={22} />
          </Link>
          <Link
            href={logado ? "/favoritos" : "/entrar"}
            className="hidden rounded-full p-2 text-neutral-700 hover:bg-emerald-50 hover:text-primary md:block"
            aria-label="Lista de desejos"
          >
            <Heart size={22} />
          </Link>
          <Link
            href={logado ? "/minha-conta" : "/entrar"}
            className="rounded-full p-2 text-neutral-700 hover:bg-emerald-50 hover:text-primary"
            aria-label="Minha conta"
          >
            <User size={22} />
          </Link>
          <Link
            href="/carrinho"
            className="relative rounded-full p-2 text-neutral-700 hover:bg-emerald-50 hover:text-primary"
            aria-label="Carrinho"
          >
            <ShoppingCart size={22} />
            {montado && totalItens > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
                {totalItens}
              </span>
            )}
          </Link>
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
          <Link
            href="/produtos"
            onClick={() => setMenuAberto(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-emerald-50"
          >
            Todos os produtos
          </Link>
          {principais.map((categoria) => (
            <div key={categoria.id}>
              <Link
                href={`/produtos?categoria=${categoria.slug}`}
                onClick={() => setMenuAberto(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-emerald-50"
              >
                {categoria.nome}
              </Link>
              {subcategoriasPorPai(categoria.id).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/produtos?categoria=${sub.slug}`}
                  onClick={() => setMenuAberto(false)}
                  className="block rounded-md py-2 pl-6 text-sm text-neutral-600 hover:bg-emerald-50"
                >
                  {sub.nome}
                </Link>
              ))}
            </div>
          ))}
          <Link
            href="/#destaques"
            onClick={() => setMenuAberto(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-emerald-50"
          >
            Destaques
          </Link>
          <Link
            href="/sobre"
            onClick={() => setMenuAberto(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-emerald-50"
          >
            Sobre nós
          </Link>
          <Link
            href="/contato"
            onClick={() => setMenuAberto(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-emerald-50"
          >
            Contato
          </Link>
          <Link
            href="/admin/entrar"
            onClick={() => setMenuAberto(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-400 hover:bg-emerald-50"
          >
            Área administrativa
          </Link>
        </nav>
      )}
    </header>
  )
}
