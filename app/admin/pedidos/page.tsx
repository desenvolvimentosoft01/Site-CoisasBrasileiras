"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type Pedido = {
  id: string
  status: string
  total: string
  origem: "site" | "balcao"
  criado_em: string
  cliente_nome: string
}

const ABAS_STATUS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aguardando_pagamento", rotulo: "Aguardando pagamento" },
  { valor: "pago", rotulo: "Pago" },
  { valor: "em_separacao", rotulo: "Em separacao" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "entregue", rotulo: "Entregue" },
  { valor: "cancelado", rotulo: "Cancelado" },
]

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
  const [aba, setAba] = useState("todos")

  useEffect(() => {
    fetch("/api/admin/pedidos")
      .then((r) => r.json())
      .then((dados) => {
        setPedidos(dados)
        setCarregando(false)
      })
  }, [])

  const pedidosFiltrados = useMemo(
    () => (aba === "todos" ? pedidos : pedidos.filter((p) => p.status === aba)),
    [pedidos, aba]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pedidos</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          {ABAS_STATUS.map((item) => {
            const quantidade =
              item.valor === "todos"
                ? pedidos.length
                : pedidos.filter((p) => p.status === item.valor).length
            return (
              <TabsTrigger key={item.valor} value={item.valor} className="flex-none px-3">
                {item.rotulo}
                {quantidade > 0 && (
                  <span className="ml-1.5 rounded-full bg-neutral-700 px-1.5 text-xs text-neutral-300">
                    {quantidade}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={aba} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {carregando ? (
                <p className="p-6 text-sm text-neutral-400">Carregando...</p>
              ) : pedidosFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-neutral-400">
                  {pedidos.length === 0
                    ? "Nenhum pedido ainda. Essa tela vai preencher quando o checkout do site estiver pronto."
                    : "Nenhum pedido com esse status."}
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
                      {pedidosFiltrados.map((pedido) => (
                        <tr
                          key={pedido.id}
                          className="cursor-pointer border-b border-neutral-800 last:border-0 hover:bg-neutral-900"
                        >
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="flex items-center gap-2 p-4">
                              {pedido.cliente_nome}
                              {pedido.origem === "balcao" && (
                                <span className="rounded-full bg-amber-600/20 px-1.5 py-0.5 text-xs text-amber-400">
                                  Balcao
                                </span>
                              )}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
