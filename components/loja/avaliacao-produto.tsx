"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"

function SeletorNota({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} estrelas`}>
          <Star size={24} className={n <= valor ? "fill-amber-400 text-amber-400" : "text-neutral-300"} />
        </button>
      ))}
    </div>
  )
}

export function AvaliacaoProduto({ produtoId }: { produtoId: string }) {
  const [carregando, setCarregando] = useState(true)
  const [logado, setLogado] = useState(false)
  const [comprou, setComprou] = useState(false)
  const [jaAvaliou, setJaAvaliou] = useState(false)
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    fetch(`/api/cliente/avaliacoes/produto/${produtoId}`)
      .then((r) => {
        if (!r.ok) {
          setLogado(false)
          return null
        }
        setLogado(true)
        return r.json()
      })
      .then((dados) => {
        if (dados) {
          setComprou(dados.comprou)
          setJaAvaliou(dados.jaAvaliou)
        }
        setCarregando(false)
      })
  }, [produtoId])

  async function enviarAvaliacao() {
    if (nota === 0) {
      setErro("Escolha uma nota")
      return
    }
    setErro("")
    setEnviando(true)

    const resposta = await fetch("/api/cliente/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produtoId, nota, comentario: comentario || null }),
    })

    setEnviando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao enviar avaliacao")
      return
    }
    setEnviado(true)
  }

  if (carregando) return null

  if (!logado) {
    return (
      <p className="text-sm text-neutral-500">
        <Link href="/entrar" className="text-primary underline">
          Entre na sua conta
        </Link>{" "}
        pra avaliar este produto (disponivel pra quem ja comprou).
      </p>
    )
  }

  if (!comprou) return null

  if (jaAvaliou || enviado) {
    return (
      <p className="text-sm text-emerald-700">
        {enviado
          ? "Avaliacao enviada! Ela aparece aqui assim que for aprovada."
          : "Voce ja avaliou este produto."}
      </p>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-black/10 p-4">
      <p className="text-sm font-medium">Avalie este produto</p>
      <SeletorNota valor={nota} onChange={setNota} />
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Conte o que achou (opcional)"
        className="min-h-20 w-full rounded-md border border-black/10 p-3 text-sm"
      />
      {erro && <p className="text-sm text-red-500">{erro}</p>}
      <button
        onClick={enviarAvaliacao}
        disabled={enviando}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Enviar avaliacao"}
      </button>
    </div>
  )
}
