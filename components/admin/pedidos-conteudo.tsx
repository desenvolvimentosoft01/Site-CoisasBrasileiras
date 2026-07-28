"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LabelCanal } from "@/components/admin/label-canal"
import { type CanalPedido } from "@/lib/canal-pedido"
import { statusExibicao } from "@/lib/status-pedido"

export type Pedido = {
  id: string
  status: string
  total: string
  origem: "site" | "balcao"
  canal: CanalPedido | null
  forma_pagamento: string | null
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

export function PedidosConteudo({ pedidosIniciais }: { pedidosIniciais: Pedido[] }) {
  const [aba, setAba] = useState("todos")
  const pedidos = pedidosIniciais

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
                  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-xs text-slate-400">
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
              {pedidosFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  {pedidos.length === 0
                    ? "Nenhum pedido ainda. Essa tela vai preencher quando o checkout do site estiver pronto."
                    : "Nenhum pedido com esse status."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Cliente</th>
                        <th className="p-4 font-medium">Canal</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map((pedido) => (
                        <tr
                          key={pedido.id}
                          className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-slate-100"
                        >
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="flex items-center gap-2 p-4">
                              {pedido.cliente_nome}
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4">
                              <LabelCanal canal={pedido.canal ?? (pedido.origem === "balcao" ? "balcao" : "site")} />
                            </Link>
                          </td>
                          <td className="p-0">
                            <Link href={`/admin/pedidos/${pedido.id}`} className="block p-4 text-slate-500">
                              <span
                                className={
                                  statusExibicao(pedido.status, pedido.criado_em) === "Provavelmente abandonado"
                                    ? "text-amber-500"
                                    : undefined
                                }
                              >
                                {statusExibicao(pedido.status, pedido.criado_em)}
                              </span>
                              {pedido.forma_pagamento && (
                                <span className="ml-1 text-xs text-slate-400">· {pedido.forma_pagamento}</span>
                              )}
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
                              className="block p-4 text-slate-500"
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
