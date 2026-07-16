"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

type Pedido = {
  id: string
  status: string
  total: string
  criado_em: string
  cliente_nome: string
}

const rotulosStatus: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch("/api/admin/pedidos")
      .then((r) => r.json())
      .then((dados) => {
        setPedidos(dados)
        setCarregando(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pedidos</h1>

      <Card>
        <CardContent className="p-0">
          {carregando ? (
            <p className="p-6 text-sm text-neutral-400">Carregando...</p>
          ) : pedidos.length === 0 ? (
            <p className="p-6 text-sm text-neutral-400">
              Nenhum pedido ainda. Essa tela vai preencher quando o checkout do site estiver pronto.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-neutral-400">
                    <th className="p-4 font-medium">Cliente</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="cursor-pointer border-b border-neutral-800 last:border-0 hover:bg-neutral-900"
                    >
                      <td className="p-0">
                        <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4">
                          {pedido.cliente_nome}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4">
                          {rotulosStatus[pedido.status] ?? pedido.status}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4">
                          {Number(pedido.total).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link
                          href={`/admin/pedidos/${pedido.id}`}
                          className="block p-4 text-neutral-400"
                        >
                          {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
