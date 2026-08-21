"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ROTULO_MOTIVO, type MotivoMovimento } from "@/lib/estoque-movimento"

type Movimento = {
  id: string
  quantidade: number
  tipo: "entrada" | "saida"
  motivo: MotivoMovimento
  saldo_apos: number
  origem_tipo: string | null
  observacao: string | null
  criado_em: string
  usuario_nome: string | null
}

// Histórico de estoque de um produto. É a tela que responde "por que esse
// produto saiu de 40 para 12?" — a pergunta que o sistema não sabia responder
// antes do kardex (migration 062).
export function ModalMovimentacaoEstoque({
  produto,
  onFechar,
}: {
  produto: { id: string; nome: string } | null
  onFechar: () => void
}) {
  const [movimentos, setMovimentos] = useState<Movimento[] | null>(null)

  // Sem reset sincrono do estado aqui: quem chama passa key={produto.id}, e o
  // componente remonta ja com "carregando" a cada produto. Zerar dentro do
  // efeito dispararia render em cascata (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!produto) return
    let cancelado = false

    fetch(`/api/admin/estoque/${produto.id}/movimentos`)
      .then((r) => (r.ok ? r.json() : []))
      .then((dados) => !cancelado && setMovimentos(dados))
      .catch(() => !cancelado && setMovimentos([]))

    // Fechar o modal antes da resposta chegar nao pode gravar estado de um
    // componente que ja saiu da tela.
    return () => {
      cancelado = true
    }
  }, [produto])

  if (!produto) return null

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Movimentação de estoque — {produto.nome}</DialogTitle>
        </DialogHeader>

        {movimentos === null ? (
          <p className="py-6 text-sm text-slate-500">Carregando...</p>
        ) : movimentos.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">
            Nenhuma movimentação registrada ainda. O histórico começa a ser gravado a partir da
            primeira entrada, venda ou ajuste feito depois desta atualização — o que aconteceu antes
            disso não foi registrado.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky top-0">
                <tr className="cabecalho-grade border-b border-slate-700">
                  <th className="p-3">Data</th>
                  <th className="p-3">Motivo</th>
                  <th className="p-3 text-right">Qtd</th>
                  <th className="p-3 text-right">Saldo</th>
                  <th className="p-3">Quem</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((movimento) => (
                  <tr key={movimento.id} className="border-b border-slate-100 last:border-0">
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      {new Date(movimento.criado_em).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3">
                      {ROTULO_MOTIVO[movimento.motivo] ?? movimento.motivo}
                      {movimento.observacao && (
                        <span className="block text-xs text-slate-400">{movimento.observacao}</span>
                      )}
                    </td>
                    <td
                      className={`p-3 text-right font-medium ${
                        movimento.tipo === "entrada" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {movimento.tipo === "entrada" ? "+" : "−"}
                      {movimento.quantidade}
                    </td>
                    <td className="p-3 text-right">{movimento.saldo_apos}</td>
                    {/* Sem usuário = movimento automático (webhook de pagamento,
                        importação de marketplace). É a diferença entre "o
                        sistema baixou" e "alguém baixou". */}
                    <td className="p-3 text-slate-500">{movimento.usuario_nome ?? "Sistema"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
