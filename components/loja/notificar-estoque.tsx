"use client"

import { useState } from "react"
import { BellRing } from "lucide-react"

export function NotificarEstoque({ produtoId }: { produtoId: string }) {
  const [email, setEmail] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro("")
    setEnviando(true)

    const resposta = await fetch(`/api/produtos/${produtoId}/notificar-estoque`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    setEnviando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao cadastrar")
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
        <BellRing size={16} />
        Pronto! Avisamos por e-mail assim que o produto voltar ao estoque.
      </p>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-2 rounded-lg border border-black/10 p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        <BellRing size={16} />
        Produto esgotado - avise-me quando chegar
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {enviando ? "..." : "Avisar"}
        </button>
      </div>
      {erro && <p className="text-sm text-red-500">{erro}</p>}
    </form>
  )
}
