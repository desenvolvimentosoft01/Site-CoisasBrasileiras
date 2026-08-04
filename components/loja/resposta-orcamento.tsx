"use client"

import { useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"

type Props = {
  token: string
  canal: "email" | "whatsapp"
  statusAtual: string
  canalResposta: string | null
  observacaoCliente: string | null
}

const STATUS_LABEL: Record<string, string> = {
  aprovado: "Voce aprovou este orcamento.",
  recusado: "Voce recusou este orcamento.",
}

export function RespostaOrcamento({ token, canal, statusAtual, canalResposta, observacaoCliente }: Props) {
  const [status, setStatus] = useState(statusAtual)
  const [enviando, setEnviando] = useState<"aprovado" | "recusado" | null>(null)
  // Recusar pede confirmacao com espaco pra observacao antes de enviar de
  // fato - aprovar e direto, sem etapa extra.
  const [confirmandoRecusa, setConfirmandoRecusa] = useState(false)
  const [observacao, setObservacao] = useState("")
  const [erro, setErro] = useState("")

  async function responder(decisao: "aprovado" | "recusado") {
    setErro("")
    setEnviando(decisao)
    try {
      const resposta = await fetch("/api/publico/orcamentos/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decisao, canal, observacao: decisao === "recusado" ? observacao : undefined }),
      })
      if (!resposta.ok) {
        const dados = await resposta.json()
        throw new Error(dados.erro || "Nao foi possivel registrar sua resposta")
      }
      setStatus(decisao)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Nao foi possivel registrar sua resposta. Tente novamente.")
    } finally {
      setEnviando(null)
    }
  }

  if (status === "aprovado" || status === "recusado") {
    return (
      <div
        className={`flex flex-col gap-2 rounded-md p-4 ${
          status === "aprovado" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {status === "aprovado" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-medium">
            {STATUS_LABEL[status]}
            {canalResposta ? ` (via ${canalResposta === "whatsapp" ? "WhatsApp" : "e-mail"})` : ""}
          </span>
        </div>
        {status === "recusado" && observacaoCliente && (
          <p className="text-center text-xs text-red-500">Sua observacao: "{observacaoCliente}"</p>
        )}
      </div>
    )
  }

  if (confirmandoRecusa) {
    return (
      <div className="flex flex-col gap-3 pt-2">
        <label className="text-sm font-medium text-slate-700">
          Quer explicar o motivo da recusa? (opcional)
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            placeholder="Ex.: preco acima do esperado, prazo muito longo..."
            className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
          />
        </label>
        {erro && <p className="text-sm text-red-500">{erro}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => responder("recusado")}
            disabled={!!enviando}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-red-500 font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            <XCircle size={16} /> {enviando === "recusado" ? "Enviando..." : "Confirmar recusa"}
          </button>
          <button
            onClick={() => setConfirmandoRecusa(false)}
            disabled={!!enviando}
            className="flex h-11 flex-1 items-center justify-center rounded-md bg-slate-100 font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pt-2">
      {erro && <p className="text-sm text-red-500">{erro}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => responder("aprovado")}
          disabled={!!enviando}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-600 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <CheckCircle2 size={16} /> {enviando === "aprovado" ? "Enviando..." : "Aprovar orcamento"}
        </button>
        <button
          onClick={() => setConfirmandoRecusa(true)}
          disabled={!!enviando}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-red-500 font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          <XCircle size={16} /> Recusar orcamento
        </button>
      </div>
    </div>
  )
}
