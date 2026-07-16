import { query } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const rotulosStatus: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

export default async function ConfirmacaoPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [pedido] = await query(
    "SELECT id, status, total, criado_em FROM TAB_PEDIDO WHERE id = $1",
    [id]
  )
  if (!pedido) notFound()

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

      <Button nativeButton={false} render={<Link href="/produtos" />}>Continuar comprando</Button>
    </div>
  )
}
