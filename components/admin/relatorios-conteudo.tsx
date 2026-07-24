"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatarMoeda } from "@/lib/mascaras"
import { AlertTriangle } from "lucide-react"
import { BotaoImprimir } from "@/components/admin/botao-imprimir"
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
  resumoEstoque: {
    total_produtos: string
    unidades_em_estoque: string
    valor_em_estoque: string
    produtos_em_baixa: string
  }
  produtosEmBaixa: { id: string; nome: string; sku: string | null; estoque: number; estoque_minimo: number }[]
}

function formatarDia(dia: string) {
  const [, mes, diaNum] = dia.split("-")
  return `${diaNum}/${mes}`
}

export function RelatoriosConteudo({
  dados,
  inicioPeriodo,
  fimPeriodo,
}: {
  dados: Relatorio
  inicioPeriodo: string
  fimPeriodo: string
}) {
  const grafico = dados.vendasPorDia.map((v) => ({
    dia: formatarDia(v.dia),
    total: Number(v.total),
  }))

  function aplicarCamposOcultos(camposOcultos: Record<string, boolean>) {
    for (const [secao, oculto] of Object.entries(camposOcultos)) {
      document.querySelectorAll<HTMLElement>(`[data-print-section="${secao}"]`).forEach((el) => {
        el.style.display = oculto ? "none" : ""
      })
    }
    // Restaura depois de imprimir - senao a secao fica escondida na tela tambem.
    setTimeout(() => {
      document.querySelectorAll<HTMLElement>("[data-print-section]").forEach((el) => {
        el.style.display = ""
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Relatorios</h1>

        <div className="flex flex-wrap items-end gap-2">
          {/* Form GET simples - recarrega a pagina com o periodo escolhido,
              sem precisar de estado client pra isso. */}
          <form action="/admin/relatorios" method="get" className="flex items-end gap-2 print:hidden">
            <div className="space-y-1">
              <Label className="text-xs">De</Label>
              <Input type="date" name="inicio" defaultValue={inicioPeriodo} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ate</Label>
              <Input type="date" name="fim" defaultValue={fimPeriodo} className="w-40" />
            </div>
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>
          <BotaoImprimir
            descricaoPeriodo={`Periodo: ${inicioPeriodo} a ${fimPeriodo}`}
            campos={[
              { chave: "resumo", rotulo: "Resumo (pedidos, faturamento, ticket)" },
              { chave: "grafico", rotulo: "Grafico de vendas" },
              { chave: "origem", rotulo: "Vendas por origem" },
              { chave: "maisVendidos", rotulo: "Produtos mais vendidos" },
              { chave: "estoque", rotulo: "Posicao de estoque" },
            ]}
            onCamposOcultos={aplicarCamposOcultos}
          />
        </div>
      </div>

      <div data-print-section="resumo" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Pedidos pagos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{dados.resumo.total_pedidos}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Faturamento no periodo</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatarMoeda(dados.resumo.faturamento_total)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Ticket medio</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatarMoeda(dados.resumo.ticket_medio)}
          </CardContent>
        </Card>
      </div>

      <Card data-print-section="grafico">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Vendas no periodo</CardTitle>
        </CardHeader>
        <CardContent>
          {grafico.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma venda no periodo.</p>
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

      <Card data-print-section="origem">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Vendas por origem</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dados.vendasPorOrigem.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">Nenhuma venda no periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Origem</th>
                    <th className="p-4 font-medium">Pedidos</th>
                    <th className="p-4 font-medium">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.vendasPorOrigem.map((linha) => (
                    <tr key={linha.origem} className="border-b border-slate-200 last:border-0">
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

      <Card data-print-section="maisVendidos">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Produtos mais vendidos no periodo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dados.produtosMaisVendidos.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">Nenhuma venda no periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">Quantidade</th>
                    <th className="p-4 font-medium">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.produtosMaisVendidos.map((produto, i) => (
                    <tr key={i} className="border-b border-slate-200 last:border-0">
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

      <div data-print-section="estoque">
        <h2 className="mb-3 text-lg font-semibold">Estoque (posicao atual)</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Produtos ativos</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {dados.resumoEstoque.total_produtos}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Unidades em estoque</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {dados.resumoEstoque.unidades_em_estoque}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Valor em estoque</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {formatarMoeda(dados.resumoEstoque.valor_em_estoque)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm text-slate-500">
                <AlertTriangle size={14} className="text-amber-500" />
                Em baixa
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-amber-500">
              {dados.resumoEstoque.produtos_em_baixa}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card data-print-section="estoque">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Produtos com estoque baixo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dados.produtosEmBaixa.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">Nenhum produto em baixa.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Produto</th>
                    <th className="p-4 font-medium">SKU</th>
                    <th className="p-4 font-medium">Minimo</th>
                    <th className="p-4 font-medium">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.produtosEmBaixa.map((produto) => (
                    <tr key={produto.id} className="border-b border-slate-200 last:border-0">
                      <td className="p-4">
                        <Link href="/admin/estoque" className="hover:underline">
                          {produto.nome}
                        </Link>
                      </td>
                      <td className="p-4 text-slate-500">{produto.sku || "-"}</td>
                      <td className="p-4 text-slate-500">{produto.estoque_minimo}</td>
                      <td className="p-4 font-medium text-amber-500">{produto.estoque}</td>
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
