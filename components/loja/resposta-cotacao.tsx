"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

type ItemCotacao = {
  id: string
  descricao: string
  quantidadeSolicitada: number
  quantidadeCotada: number | null
  valorUnitarioCotado: number | null
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function RespostaCotacao({
  token,
  status,
  itens,
}: {
  token: string
  status: string
  itens: ItemCotacao[]
}) {
  const [respondida, setRespondida] = useState(status !== "enviado")
  const [valores, setValores] = useState(
    Object.fromEntries(
      itens.map((item) => [
        item.id,
        {
          quantidade: String(item.quantidadeCotada ?? item.quantidadeSolicitada),
          valorUnitario: item.valorUnitarioCotado != null ? String(item.valorUnitarioCotado).replace(".", ",") : "",
        },
      ])
    )
  )
  const [desconto, setDesconto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  function atualizar(itemId: string, campo: "quantidade" | "valorUnitario", valor: string) {
    setValores((atual) => ({ ...atual, [itemId]: { ...atual[itemId], [campo]: valor } }))
  }

  const subtotal = itens.reduce(
    (soma, item) =>
      soma +
      (Number(valores[item.id].quantidade) || 0) *
        (Number((valores[item.id].valorUnitario || "0").replace(",", ".")) || 0),
    0
  )
  const totalComDesconto = Math.max(0, subtotal - (Number(desconto.replace(",", ".")) || 0))

  async function enviar() {
    setErro("")

    const itensPayload = itens.map((item) => ({
      itemId: item.id,
      quantidadeCotada: Number(valores[item.id].quantidade) || 0,
      valorUnitarioCotado: Number((valores[item.id].valorUnitario || "0").replace(",", ".")) || 0,
    }))

    if (itensPayload.some((i) => i.valorUnitarioCotado <= 0)) {
      setErro("Informe o preço de todos os itens")
      return
    }

    setEnviando(true)
    const resposta = await fetch("/api/publico/cotacoes/responder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        itens: itensPayload,
        desconto: Number(desconto.replace(",", ".")) || 0,
      }),
    })
    setEnviando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Não foi possível enviar sua cotação. Tente novamente.")
      return
    }
    setRespondida(true)
  }

  if (respondida) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md bg-primary/10 p-4 text-primary">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">
          {status === "enviado" ? "Cotação enviada! Obrigado." : "Essa cotação já foi respondida."}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium">Qtde. pedida</th>
              <th className="p-3 font-medium">Qtde. que consegue</th>
              <th className="p-3 font-medium">Preço unit. (R$)</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-b border-slate-200 last:border-0">
                <td className="p-3">{item.descricao}</td>
                <td className="p-3 text-slate-500">{item.quantidadeSolicitada}</td>
                <td className="p-3">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={valores[item.id].quantidade}
                    onChange={(e) => atualizar(item.id, "quantidade", e.target.value)}
                    className="w-24 rounded-md border border-slate-300 p-2 text-sm"
                  />
                </td>
                <td className="p-3">
                  <input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valores[item.id].valorUnitario}
                    onChange={(e) => atualizar(item.id, "valorUnitario", e.target.value)}
                    className="w-28 rounded-md border border-slate-300 p-2 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-end gap-1 border-t border-slate-200 pt-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Desconto (R$, opcional)
          <input
            inputMode="decimal"
            placeholder="0,00"
            value={desconto}
            onChange={(e) => setDesconto(e.target.value)}
            className="w-28 rounded-md border border-slate-300 p-2 text-sm"
          />
        </label>
        {Number(desconto.replace(",", ".")) > 0 && (
          <p className="text-xs text-slate-500">Subtotal: {formatarMoeda(subtotal)}</p>
        )}
        <p className="text-sm font-semibold text-slate-800">Total: {formatarMoeda(totalComDesconto)}</p>
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <button
        onClick={enviar}
        disabled={enviando}
        className="flex h-11 w-full items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar cotação"}
      </button>
    </div>
  )
}
