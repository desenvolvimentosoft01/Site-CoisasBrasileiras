"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatarMoeda } from "@/lib/mascaras"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

export type Relatorio = {
  vendasPorDia: { dia: string; total: string }[]
  produtosMaisVendidos: { nome: string; quantidade: string; faturamento: string }[]
  resumo: { total_pedidos: string; faturamento_total: string; ticket_medio: string }
  vendasPorOrigem: { origem: "site" | "balcao"; total_pedidos: string; faturamento: string }[]
}

function formatarDia(dia: string) {
  const [, mes, diaNum] = dia.split("-")
  return `${diaNum}/${mes}`
}

export function RelatoriosConteudo({ dados }: { dados: Relatorio }) {
  const grafico = dados.vendasPorDia.map((v) => ({
    dia: formatarDia(v.dia),
    total: Number(v.total),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Relatorios de vendas</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Pedidos pagos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{dados.resumo.total_pedidos}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Faturamento total</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatarMoeda(dados.resumo.faturamento_total)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Ticket medio</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatarMoeda(dados.resumo.ticket_medio)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-neutral-400">Vendas nos ultimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          {grafico.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma venda no periodo.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={grafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="dia" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #333" }}
                    formatter={(valor) => formatarMoeda(Number(valor))}
                  />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-neutral-400">Vendas por origem</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dados.vendasPorOrigem.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">Nenhuma venda ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-neutral-400">
                    <th className="p-4 font-medium">Origem</th>
                    <th className="p-4 font-medium">Pedidos</th>
                    <th className="p-4 font-medium">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.vendasPorOrigem.map((linha) => (
                    <tr key={linha.origem} className="border-b border-neutral-800 last:border-0">
                      <td className="p-4 capitalize">{linha.origem === "balcao" ? "Balcao" : "Site"}</td>
                      <td className="p-4">{linha.total_pedidos}</td>
                      <td className="p-4">{formatarMoeda(linha.faturamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-neutral-400">Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dados.produtosMaisVendidos.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">Nenhuma venda ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-neutral-400">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">Quantidade</th>
                    <th className="p-4 font-medium">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.produtosMaisVendidos.map((produto, i) => (
                    <tr key={i} className="border-b border-neutral-800 last:border-0">
                      <td className="p-4">{produto.nome}</td>
                      <td className="p-4">{produto.quantidade}</td>
                      <td className="p-4">{formatarMoeda(produto.faturamento)}</td>
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
