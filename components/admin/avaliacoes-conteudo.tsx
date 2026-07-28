"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Check, Trash2 } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"

export type Avaliacao = {
  id: string
  nota: number
  comentario: string | null
  aprovado: boolean
  criado_em: string
  produto_nome: string
  cliente_nome: string
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= nota ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
      ))}
    </div>
  )
}

export function AvaliacoesConteudo({ avaliacoesIniciais }: { avaliacoesIniciais: Avaliacao[] }) {
  const confirmar = useConfirmar()
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>(avaliacoesIniciais)
  const [filtro, setFiltro] = useState<"pendentes" | "aprovadas" | "todas">("pendentes")

  async function recarregar() {
    const resposta = await fetch("/api/admin/avaliacoes")
    setAvaliacoes(await resposta.json())
  }

  async function aprovar(avaliacao: Avaliacao) {
    await fetch(`/api/admin/avaliacoes/${avaliacao.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprovado: true }),
    })
    registrarAuditoria({
      tela: "Avaliacoes",
      acao: "edicao",
      tabela: "TAB_AVALIACAO_PRODUTO",
      registroId: avaliacao.id,
      antes: { aprovado: false },
      depois: { aprovado: true },
    })
    recarregar()
  }

  async function excluir(avaliacao: Avaliacao) {
    if (!(await confirmar({ descricao: `Excluir a avaliacao de "${avaliacao.cliente_nome}" pra "${avaliacao.produto_nome}"?`, destrutivo: true }))) return
    await fetch(`/api/admin/avaliacoes/${avaliacao.id}`, { method: "DELETE" })
    registrarAuditoria({
      tela: "Avaliacoes",
      acao: "exclusao",
      tabela: "TAB_AVALIACAO_PRODUTO",
      registroId: avaliacao.id,
      antes: { produto: avaliacao.produto_nome, cliente: avaliacao.cliente_nome },
    })
    recarregar()
  }

  const avaliacoesFiltradas = avaliacoes.filter((a) => {
    if (filtro === "pendentes") return !a.aprovado
    if (filtro === "aprovadas") return a.aprovado
    return true
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Avaliacoes de produto</h1>

      <div className="flex flex-wrap items-center gap-2">
        {(["pendentes", "aprovadas", "todas"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFiltro(status)}
            className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
              filtro === status
                ? "border-primary bg-primary/15 text-primary"
                : "border-input text-muted-foreground hover:border-primary/50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {avaliacoesFiltradas.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhuma avaliacao aqui.</p>
          ) : (
            <div className="divide-y divide-border">
              {avaliacoesFiltradas.map((avaliacao) => (
                <div key={avaliacao.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{avaliacao.produto_nome}</span>
                      <Estrelas nota={avaliacao.nota} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {avaliacao.cliente_nome} · {new Date(avaliacao.criado_em).toLocaleDateString("pt-BR")}
                    </p>
                    {avaliacao.comentario && <p className="text-sm">{avaliacao.comentario}</p>}
                    {!avaliacao.aprovado && (
                      <span className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-500">
                        Pendente
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!avaliacao.aprovado && (
                      <Button variant="ghost" size="icon-lg" onClick={() => aprovar(avaliacao)} title="Aprovar">
                        <Check size={16} className="text-emerald-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-lg" onClick={() => excluir(avaliacao)} title="Excluir">
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
