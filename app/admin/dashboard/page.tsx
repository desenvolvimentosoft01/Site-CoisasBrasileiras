import { query } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatarMoeda } from "@/lib/mascaras"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

const rotulosStatus: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

export default async function DashboardPage() {
  const [
    [{ count: produtosAtivos }],
    [{ count: pedidosHoje }],
    [{ soma: faturamentoMes }],
    [{ count: pedidosPendentes }],
    [{ count: vendasBalcaoHoje, soma: faturamentoBalcaoHoje }],
    produtosEstoqueBaixo,
    pedidosRecentes,
  ] = await Promise.all([
    query("SELECT COUNT(*) FROM TAB_PRODUTO WHERE ativo = true"),
    query("SELECT COUNT(*) FROM TAB_PEDIDO WHERE criado_em::date = CURRENT_DATE"),
    query(
      `SELECT COALESCE(SUM(total), 0) AS soma FROM TAB_PEDIDO
       WHERE status = 'pago' AND date_trunc('month', criado_em) = date_trunc('month', CURRENT_DATE)`
    ),
    query("SELECT COUNT(*) FROM TAB_PEDIDO WHERE status = 'aguardando_pagamento'"),
    query(
      `SELECT COUNT(*), COALESCE(SUM(total), 0) AS soma FROM TAB_PEDIDO
       WHERE origem = 'balcao' AND criado_em::date = CURRENT_DATE`
    ),
    query(
      "SELECT id, nome, estoque, estoque_minimo FROM TAB_PRODUTO WHERE ativo = true AND estoque <= estoque_minimo ORDER BY estoque LIMIT 5"
    ),
    query(
      `SELECT p.id, p.status, p.total, p.origem, p.criado_em,
         COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente balcao') AS cliente_nome
       FROM TAB_PEDIDO p LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
       ORDER BY p.criado_em DESC LIMIT 5`
    ),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Produtos ativos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{produtosAtivos}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Pedidos hoje (site)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{pedidosHoje}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Vendas balcao hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{vendasBalcaoHoje}</div>
            <div className="text-xs text-slate-400">{formatarMoeda(faturamentoBalcaoHoje)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Faturamento do mes</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatarMoeda(faturamentoMes)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Aguardando pagamento</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{pedidosPendentes}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Ultimos pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pedidosRecentes.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum pedido ainda.</p>
            ) : (
              pedidosRecentes.map((pedido) => (
                <Link
                  key={pedido.id}
                  href={`/admin/pedidos/${pedido.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
                >
                  <div>
                    <div className="font-medium">{pedido.cliente_nome}</div>
                    <div className="text-xs text-slate-400">
                      {rotulosStatus[pedido.status] ?? pedido.status}
                      {pedido.origem === "balcao" && (
                        <span className="ml-2 rounded-full bg-amber-600/20 px-1.5 py-0.5 text-amber-400">
                          Balcao
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-medium">{formatarMoeda(pedido.total)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
              <AlertTriangle size={16} className="text-amber-500" />
              Estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {produtosEstoqueBaixo.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum produto com estoque baixo.</p>
            ) : (
              produtosEstoqueBaixo.map((produto) => (
                <Link
                  key={produto.id}
                  href={`/admin/produtos/${produto.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
                >
                  <span className="font-medium">{produto.nome}</span>
                  <span className="text-amber-500">
                    {produto.estoque} / min. {produto.estoque_minimo}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
