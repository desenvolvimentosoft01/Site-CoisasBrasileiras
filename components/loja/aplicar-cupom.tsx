"use client"

import { useState } from "react"
import { Tag, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCarrinho } from "@/lib/carrinho-store"

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function AplicarCupom({ subtotal }: { subtotal: number }) {
  const { cupom, setCupom } = useCarrinho()
  const [codigo, setCodigo] = useState("")
  const [validando, setValidando] = useState(false)
  const [erro, setErro] = useState("")

  async function aplicar() {
    if (!codigo.trim()) return
    setErro("")
    setValidando(true)

    const resposta = await fetch("/api/cupom/validar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, subtotal }),
    })

    setValidando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Cupom invalido")
      return
    }

    const { desconto } = await resposta.json()
    setCupom({ codigo: codigo.trim().toUpperCase(), desconto })
    setCodigo("")
  }

  if (cupom) {
    return (
      <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm">
        <span className="flex items-center gap-2 text-primary">
          <Tag size={14} />
          Cupom {cupom.codigo} aplicado (-{formatarPreco(cupom.desconto)})
        </span>
        <button
          type="button"
          onClick={() => setCupom(null)}
          className="text-neutral-400 hover:text-red-500"
          aria-label="Remover cupom"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Codigo do cupom"
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={aplicar} disabled={validando || !codigo.trim()}>
          {validando ? "..." : "Aplicar"}
        </Button>
      </div>
      {erro && <p className="mt-1 text-xs text-red-500">{erro}</p>}
    </div>
  )
}
