import { query } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatarMoeda } from "@/lib/mascaras"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default async function FinanceiroPage() {
  const [
    [{ soma: totalPagar }],
    [{ soma: totalReceber }],
    [{ soma: faturamentoMes }],
    contasVencendo,
    contasAtrasadas,
  ] = await Promise.all([
    query("SELECT COALESCE(SUM(valor), 0) AS soma FROM TAB_CONTA WHERE tipo = 'pagar' AND pago = false"),
    query("SELECT COALESCE(SUM(valor), 0) AS soma FROM TAB_CONTA WHERE tipo = 'receber' AND pago = false"),
    query(
      `SELECT COALESCE(SUM(total), 0) AS soma FROM TAB_PEDIDO
       WHERE status = 'pago' AND date_trunc('month', criado_em) = date_trunc('month', CURRENT_DATE)`
    ),
    query(
      `SELECT id, tipo, descricao, valor, vencimento FROM TAB_CONTA
       WHERE pago = false AND vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       ORDER BY vencimento LIMIT 8`
    ),
    query(
      `SELECT id, tipo, descricao, valor, vencimento FROM TAB_CONTA
       WHERE pago = false AND vencimento < CURRENT_DATE
       ORDER BY vencimento LIMIT 8`
    ),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <Link href="/admin/financeiro/contas" className="text-sm text-primary hover:underline">
          Ver todas as contas
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">A pagar (em aberto)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-red-400">
            {formatarMoeda(totalPagar)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">A receber (em aberto)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-emerald-400">
            {formatarMoeda(totalReceber)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Faturamento do site (mes)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{formatarMoeda(faturamentoMes)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Vencendo nos proximos 7 dias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contasVencendo.length === 0 ? (
              <p className="text-sm text-neutral-500">Nenhuma conta vencendo.</p>
            ) : (
              contasVencendo.map((conta) => (
                <div key={conta.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{conta.descricao}</div>
                    <div className="text-xs text-neutral-500">
                      {new Date(conta.vencimento).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <span className={conta.tipo === "pagar" ? "text-red-400" : "text-emerald-400"}>
                    {formatarMoeda(conta.valor)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-neutral-400">
              <AlertTriangle size={16} className="text-amber-500" />
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contasAtrasadas.length === 0 ? (
              <p className="text-sm text-neutral-500">Nenhuma conta atrasada.</p>
            ) : (
              contasAtrasadas.map((conta) => (
                <div key={conta.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{conta.descricao}</div>
                    <div className="text-xs text-amber-500">
                      Venceu em {new Date(conta.vencimento).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <span className={conta.tipo === "pagar" ? "text-red-400" : "text-emerald-400"}>
                    {formatarMoeda(conta.valor)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
