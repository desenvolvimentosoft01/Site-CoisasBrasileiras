import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatarMoeda } from "@/lib/mascaras"
import { TrendingDown, TrendingUp } from "lucide-react"
import type { Dre } from "@/lib/relatorio-lucro"
import Link from "next/link"

function variacao(atual: number, anterior: number): { percentual: number; positivo: boolean } | null {
  if (anterior === 0) return null
  const percentual = ((atual - anterior) / Math.abs(anterior)) * 100
  return { percentual, positivo: percentual >= 0 }
}

function Selo({ atual, anterior }: { atual: number; anterior: number }) {
  const v = variacao(atual, anterior)
  if (!v) return null
  const Icone = v.positivo ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${v.positivo ? "text-emerald-500" : "text-red-400"}`}>
      <Icone size={12} />
      {v.percentual >= 0 ? "+" : ""}
      {v.percentual.toFixed(1)}% vs periodo anterior
    </span>
  )
}

export function RelatorioLucroConteudo({
  dre,
  dreAnterior,
  inicioPeriodo,
  fimPeriodo,
  periodoAnteriorLabel,
}: {
  dre: Dre
  dreAnterior: Dre
  inicioPeriodo: string
  fimPeriodo: string
  periodoAnteriorLabel: string
}) {
  const semConfiguracao = dre.faturamento > 0 && dre.taxasPagamento === 0 && dre.aliquotaImposto === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Lucro / DRE gerencial</h1>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/relatorios" className="hover:underline">
              Relatorios
            </Link>{" "}
            / Lucro
          </p>
        </div>

        <form action="/admin/relatorios/lucro" method="get" className="flex items-end gap-2">
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
      </div>

      {semConfiguracao && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="pt-6 text-sm text-amber-500">
            Taxas de pagamento e aliquota de imposto ainda nao configuradas — os valores abaixo
            nao descontam essas despesas. Configure em{" "}
            <Link href="/admin/configuracoes" className="underline">
              Configuracoes &gt; Custos
            </Link>{" "}
            pra um numero mais proximo do real.
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Comparando com o periodo anterior de mesma duracao ({periodoAnteriorLabel})
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold">{formatarMoeda(dre.faturamento)}</div>
            <Selo atual={dre.faturamento} anterior={dreAnterior.faturamento} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">CMV (custo dos produtos vendidos)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-red-400">{formatarMoeda(dre.cmv)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Margem bruta</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatarMoeda(dre.margemBruta)}</CardContent>
        </Card>
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Lucro liquido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className={`text-2xl font-semibold ${dre.lucroLiquido >= 0 ? "text-emerald-500" : "text-red-400"}`}>
              {formatarMoeda(dre.lucroLiquido)}
            </div>
            <Selo atual={dre.lucroLiquido} anterior={dreAnterior.lucroLiquido} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Composicao do resultado</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2">Faturamento (pedidos pagos no periodo)</td>
                <td className="py-2 text-right font-medium">{formatarMoeda(dre.faturamento)}</td>
              </tr>
              <tr className="border-b border-border text-red-400">
                <td className="py-2">(-) CMV</td>
                <td className="py-2 text-right">{formatarMoeda(dre.cmv)}</td>
              </tr>
              <tr className="border-b border-border font-medium">
                <td className="py-2">= Margem bruta</td>
                <td className="py-2 text-right">{formatarMoeda(dre.margemBruta)}</td>
              </tr>
              <tr className="border-b border-border text-red-400">
                <td className="py-2">(-) Taxas de pagamento (estimado)</td>
                <td className="py-2 text-right">{formatarMoeda(dre.taxasPagamento)}</td>
              </tr>
              <tr className="border-b border-border text-red-400">
                <td className="py-2">(-) Imposto estimado ({dre.aliquotaImposto}% sobre faturamento)</td>
                <td className="py-2 text-right">{formatarMoeda(dre.imposto)}</td>
              </tr>
              <tr className="border-b border-border text-red-400">
                <td className="py-2">(-) Despesas fixas do periodo (contas a pagar, exceto compras)</td>
                <td className="py-2 text-right">{formatarMoeda(dre.despesasFixas)}</td>
              </tr>
              <tr className="text-base font-semibold">
                <td className="py-2">= Lucro liquido estimado</td>
                <td className={`py-2 text-right ${dre.lucroLiquido >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                  {formatarMoeda(dre.lucroLiquido)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Margem por produto</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dre.produtos.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Nenhuma venda no periodo.</p>
            ) : (
              <div className="max-h-96 overflow-x-auto overflow-y-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-slate-500">
                      <th className="p-3 font-medium">Produto</th>
                      <th className="p-3 font-medium text-right">Margem</th>
                      <th className="p-3 font-medium text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dre.produtos.map((p) => (
                      <tr key={p.produto_id} className="border-b border-border last:border-0">
                        <td className="p-3">{p.nome}</td>
                        <td className={`p-3 text-right ${p.margem >= 0 ? "" : "text-red-400"}`}>
                          {formatarMoeda(p.margem)}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{p.margem_percentual.toFixed(1)}%</td>
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
            <CardTitle className="text-sm text-slate-500">Margem por categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dre.categorias.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Nenhuma venda no periodo.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-slate-500">
                    <th className="p-3 font-medium">Categoria</th>
                    <th className="p-3 font-medium text-right">Margem</th>
                    <th className="p-3 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dre.categorias.map((c) => (
                    <tr key={c.categoria} className="border-b border-border last:border-0">
                      <td className="p-3">{c.categoria}</td>
                      <td className={`p-3 text-right ${c.margem >= 0 ? "" : "text-red-400"}`}>
                        {formatarMoeda(c.margem)}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{c.margem_percentual.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
