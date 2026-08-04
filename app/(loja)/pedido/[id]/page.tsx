import { query } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Truck, Check, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const rotulosStatus: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

// Etapas do rastreio visual - "aguardando_pagamento" e "cancelado" nao entram
// na linha do tempo normal (o pedido so aparece aqui depois de confirmado).
const etapasRastreio = ["pago", "em_separacao", "enviado", "entregue"]

export default async function ConfirmacaoPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [pedido] = await query(
    "SELECT id, status, total, criado_em, codigo_rastreio, transportadora, bling_link_danfe FROM TAB_PEDIDO WHERE id = $1",
    [id]
  )
  if (!pedido) notFound()

  const etapaAtual = etapasRastreio.indexOf(pedido.status)

  const itens = await query(
    `SELECT pi.quantidade, pi.preco_unitario, p.nome
     FROM TAB_PEDIDO_ITEM pi
     JOIN TAB_PRODUTO p ON p.id = pi.produto_id
     WHERE pi.pedido_id = $1`,
    [id]
  )

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-600" />
      <h1 className="font-heading mb-2 text-2xl font-semibold text-emerald-950">
        Pedido recebido!
      </h1>
      <p className="mb-8 text-neutral-500">
        Status: {rotulosStatus[pedido.status] ?? pedido.status}
      </p>

      {etapaAtual >= 0 && (
        <div className="mb-8">
          <div className="flex items-center">
            {etapasRastreio.map((etapa, i) => (
              <div key={etapa} className="flex flex-1 items-center last:flex-none">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    i <= etapaAtual
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-200 text-neutral-400"
                  }`}
                >
                  {i <= etapaAtual ? <Check size={14} /> : i + 1}
                </div>
                {i < etapasRastreio.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${i < etapaAtual ? "bg-emerald-600" : "bg-neutral-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-neutral-500">
            <span>Pago</span>
            <span>Separação</span>
            <span>Enviado</span>
            <span>Entregue</span>
          </div>
        </div>
      )}

      {pedido.codigo_rastreio && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
          <Truck size={22} className="shrink-0 text-emerald-700" />
          <div className="text-sm">
            <div className="font-medium text-emerald-900">
              {pedido.transportadora || "Rastreio"}: {pedido.codigo_rastreio}
            </div>
            <div className="text-emerald-700">Use o código acima no site da transportadora</div>
          </div>
        </div>
      )}

      <div className="mb-8 space-y-2 rounded-xl border border-black/5 p-5 text-left">
        {itens.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-neutral-600">
              {item.quantidade}x {item.nome}
            </span>
            <span className="font-medium">
              {formatarPreco(String(item.preco_unitario * item.quantidade))}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-black/5 pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="text-emerald-700">{formatarPreco(pedido.total)}</span>
        </div>
      </div>

      {pedido.bling_link_danfe && (
        <a
          href={pedido.bling_link_danfe}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <FileText size={16} />
          Baixar nota fiscal (DANFE)
        </a>
      )}

      <Button nativeButton={false} render={<Link href="/produtos" />}>Continuar comprando</Button>
    </div>
  )
}
