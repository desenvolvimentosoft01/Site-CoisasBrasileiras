"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react"
import { NOME_SISTEMA, FABRICANTE_SISTEMA, CONTATO_FABRICANTE } from "@/lib/constantes"

// Tela de entrada em duas metades, no mesmo modelo do InMenteGestao: a
// esquerda escura apresenta o SISTEMA (quem está entrando precisa saber em que
// sistema está entrando, e não só em que loja), a direita clara tem o
// formulário e nada mais.
//
// A metade escura some no celular: numa tela de 375px ela empurraria o
// formulário pra baixo da dobra, e quem abre o login quer digitar a senha, não
// ler propaganda. A marca do sistema continua aparecendo, em cima do card.
//
// A lista abaixo e o que o SISTEMA faz - e não o que esta instalação
// contratou. A tela de entrada é a vitrine do produto: mostra a régua
// inteira, e o plano de cada cliente decide o que ele enxerga depois de
// entrar.
//
// Uma linha por frente de trabalho, na ordem em que o dinheiro entra: vende
// (loja e balcao), controla o que vendeu (pedidos e estoque), presta conta
// (fiscal), repoe (compras), divulga (marketing) e fecha o mes (financeiro).
// Oito linhas e o teto - passou disso vira lista de recurso, e ninguem le
// lista de recurso na tela de login.
const DESTAQUES = [
  "Loja virtual com carrinho, checkout e área do cliente",
  "Pedido de Venda Balcão com carrinho",
  "Pedidos, orçamentos e clientes",
  "Estoque e custo atualizados pela nota de entrada",
  "DANFE e XML de entrada e saída, prontos pro contador",
  "Compras: cotação, pedido de compra e fornecedores",
  "Marketing: cupons, banners, clube e avaliações",
  "Financeiro, relatórios, auditoria e permissão por tela",
]

// Integrações que o sistema fala. Cada instalação libera as suas no plano.
const INTEGRACOES = ["Bling (NF-e)", "Mercado Pago", "Frenet", "Mercado Livre", "Shopee", "iFood"]

export function EntrarForm({
  corPrimaria,
}: {
  corPrimaria: string
}) {
  const router = useRouter()
  const [login, setLogin] = useState("")
  const [senha, setSenha] = useState("")
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [mostrarAjudaSenha, setMostrarAjudaSenha] = useState(false)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    setErro("")
    setCarregando(true)

    const resposta = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, senha }),
    })

    setCarregando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Não foi possível entrar")
      return
    }

    // Senha provisoria (cadastro novo ou reset pelo admin) vai direto pra
    // troca, em vez de abrir a Visao Geral e ser redirecionada em seguida.
    const dados = await resposta.json()
    router.push(dados.senhaProvisoria ? "/admin/trocar-senha" : "/admin/dashboard")
    router.refresh()
  }

  return (
    <div
      className="flex min-h-screen bg-white"
      style={{ "--primary": corPrimaria } as React.CSSProperties}
    >
      {/* ---- Metade da apresentacao (só no desktop) ---- */}
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-center lg:px-10 xl:px-14">
        {/* Formas de fundo: circulos no topo e uma onda embaixo, na cor da
            loja - a mesma --primary configurada em Configuracoes > Aparencia,
            pra que cada instalacao tenha a cara do proprio cliente. */}
        <div className="pointer-events-none absolute inset-0">
          <div className="animar-flutuar absolute -left-24 -top-24 h-80 w-80 rounded-full bg-slate-800/60 blur-2xl" />
          <div className="animar-flutuar-inverso absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--primary)] opacity-20 blur-3xl" />
          <div className="animar-onda absolute -bottom-32 -left-16 h-[28rem] w-[140%] rotate-[-8deg] rounded-[50%] bg-gradient-to-r from-[var(--primary)] to-slate-800 opacity-70" />
          <div className="animar-flutuar absolute bottom-1/3 right-10 h-56 w-56 rounded-full bg-slate-700/50 blur-2xl [animation-duration:16s]" />
          <div className="animar-brilho absolute -top-1/4 left-0 h-[150%] w-40 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl" />
        </div>

        <div className="relative max-h-full min-h-0 overflow-y-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/5">
              <Image src="/logo-sistema.svg" alt="" width={44} height={44} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-tight tracking-tight text-white">{NOME_SISTEMA}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{FABRICANTE_SISTEMA}</p>
            </div>
          </div>

          <p className="mt-8 max-w-md text-xl leading-relaxed text-slate-200">
            Vendas, estoque, compras e fiscal em um lugar só.
          </p>

          <ul className="mt-8 space-y-2.5">
            {DESTAQUES.map((destaque, indice) => (
              <li
                key={destaque}
                className="animar-entrada-item flex items-center gap-3 text-slate-300"
                // Um item a cada 0,12s: a lista inteira se monta em menos de
                // um segundo. O escalonamento e so pelo efeito de cascata -
                // nao pra dar tempo de ler uma linha por vez, ja que quem quer
                // ler le com a lista parada.
                style={{ animationDelay: `${indice * 0.12 + 0.15}s` }}
              >
                <Check size={18} className="shrink-0 text-emerald-400" />
                {destaque}
              </li>
            ))}
          </ul>

          {/* Entra depois da lista terminar de aparecer, pra nao competir com
              ela. Sao as integracoes do SISTEMA - o que cada loja usa depende
              do plano dela. */}
          <div
            className="animar-entrada-item mt-8 max-w-md"
            style={{ animationDelay: `${DESTAQUES.length * 0.12 + 0.3}s` }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Integrações
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTEGRACOES.map((integracao) => (
                <span
                  key={integracao}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300"
                >
                  {integracao}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Metade do formulario ---- */}
      <div className="relative flex w-full flex-col justify-center px-5 pb-10 pt-20 sm:px-10 sm:pt-24 lg:w-1/2 lg:px-20 lg:py-10">
        <Link
          href="/"
          className="absolute left-5 top-5 flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-700 sm:left-8 sm:top-8"
        >
          <ArrowLeft size={16} />
          Voltar ao site
        </Link>

        {/* No celular a metade escura nao existe, entao a marca do sistema
            precisa aparecer aqui - senao a pessoa entra sem saber onde está. */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <Image src="/logo-sistema.svg" alt="" width={36} height={36} />
          <div>
            <p className="text-base font-bold leading-tight text-slate-900">{NOME_SISTEMA}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{FABRICANTE_SISTEMA}</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo</h1>
          <p className="mt-1 text-sm text-slate-500">Acesse o {NOME_SISTEMA}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login" className="text-sm font-semibold text-slate-700">
                Usuário
              </label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoFocus
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="senha" className="text-sm font-semibold text-slate-700">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={senhaVisivel ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="Sua senha"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                <button
                  type="button"
                  onClick={() => setSenhaVisivel((v) => !v)}
                  className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:right-2 sm:h-9 sm:w-9"
                  aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                >
                  {senhaVisivel ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMostrarAjudaSenha((v) => !v)}
                className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
              >
                Esqueci minha senha
              </button>
              {mostrarAjudaSenha && (
                <p className="mt-2 text-xs text-slate-400">
                  Fale com o administrador do sistema para redefinir sua senha.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Contato da agencia: e por aqui que o cliente pede suporte, e a
            tela de entrada e onde ele esta quando alguma coisa nao funciona. */}
        <div className="mt-10 space-y-0.5 text-xs text-slate-400">
          <p className="font-medium text-slate-500">
            {NOME_SISTEMA} — {FABRICANTE_SISTEMA}
          </p>
          <p>
            <a href={`mailto:${CONTATO_FABRICANTE.email}`} className="hover:text-slate-600 hover:underline">
              {CONTATO_FABRICANTE.email}
            </a>
          </p>
          <p>
            Tel: {CONTATO_FABRICANTE.telefone} · {CONTATO_FABRICANTE.cidade}
          </p>
        </div>
      </div>
    </div>
  )
}
