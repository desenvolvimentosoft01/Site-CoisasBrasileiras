"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react"

export function EntrarForm({
  logoUrl,
  nomeLoja,
  corPrimaria,
}: {
  logoUrl?: string
  nomeLoja: string
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-4"
      style={{ "--primary": corPrimaria } as React.CSSProperties}
    >
      {/* Fundo com dois brilhos radiais (escuro -> cor primaria da loja) -
          puramente decorativo, cada instancia/cliente herda a cor configurada
          em Configuracoes > Aparencia via --primary. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/3 h-[32rem] w-[32rem] rounded-full bg-black/40 blur-3xl" />
        <div className="absolute -right-40 top-1/4 h-[36rem] w-[36rem] rounded-full bg-[var(--primary)] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[24rem] w-[24rem] rounded-full bg-[var(--primary)] opacity-20 blur-3xl" />
      </div>

      <Link
        href="/"
        className="absolute left-6 top-6 z-10 flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Voltar ao site
      </Link>

      <div className="relative w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <h1 className="text-2xl font-bold text-neutral-900">Bem-vindo(a)</h1>
        <p className="mt-1 text-sm text-neutral-500">Acesse sua conta para continuar</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login" className="text-sm font-medium text-neutral-700">
              E-mail
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="senha" className="text-sm font-medium text-neutral-700">
              Senha
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="senha"
                type={senhaVisivel ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-10 text-sm text-neutral-900 outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20"
              />
              <button
                type="button"
                onClick={() => setSenhaVisivel((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
              >
                {senhaVisivel ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-right">
            <button
              type="button"
              onClick={() => setMostrarAjudaSenha((v) => !v)}
              className="text-sm font-medium text-neutral-500 underline-offset-2 hover:text-[var(--primary)] hover:underline"
            >
              Esqueci minha senha
            </button>
            {mostrarAjudaSenha && (
              <p className="mt-2 text-left text-xs text-neutral-400">
                Fale com o administrador do sistema para redefinir sua senha.
              </p>
            )}
          </div>
        </form>
      </div>

      <div className="pointer-events-none absolute bottom-6 right-6 flex items-center gap-2 opacity-70">
        <Image src={logoUrl || "/logo.webp"} alt={nomeLoja} width={28} height={28} />
        <span className="font-heading text-sm font-semibold text-white">{nomeLoja}</span>
      </div>
    </div>
  )
}
