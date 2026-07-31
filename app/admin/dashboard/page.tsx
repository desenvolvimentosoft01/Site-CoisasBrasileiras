import { query } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatarMoeda } from "@/lib/mascaras"
import Link from "next/link"
import { AlertTriangle, Package, ShoppingCart, Store, Wallet, Clock, type LucideIcon } from "lucide-react"
import { LabelCanal } from "@/components/admin/label-canal"
import { statusExibicao } from "@/lib/status-pedido"

// Um "tema" de cor por indicador do dashboard, pra cada card ter identidade
// visual propria em vez de ficar tudo branco/cinza igual.
const coresIndicador = {
  verde: "bg-emerald-50 text-emerald-600",
  azul: "bg-blue-50 text-blue-600",
  ambar: "bg-amber-50 text-amber-600",
  roxo: "bg-purple-50 text-purple-600",
  rosa: "bg-rose-50 text-rose-600",
} as const

function CardIndicador({
  titulo,
  icone: Icone,
  cor,
  children,
}: {
  titulo: string
  icone: LucideIcon
  cor: keyof typeof coresIndicador
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm text-slate-500">{titulo}</CardTitle>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${coresIndicador[cor]}`}>
          <Icone size={18} />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
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
      `SELECT p.id, p.status, p.total, p.origem, p.canal, p.forma_pagamento, p.criado_em,
         COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente balcao') AS cliente_nome
       FROM TAB_PEDIDO p LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
       ORDER BY p.criado_em DESC LIMIT 5`
    ),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Visao Geral</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <CardIndicador titulo="Produtos ativos" icone={Package} cor="verde">
          <div className="text-3xl font-semibold">{produtosAtivos}</div>
        </CardIndicador>
        <CardIndicador titulo="Pedidos hoje (site)" icone={ShoppingCart} cor="azul">
          <div className="text-3xl font-semibold">{pedidosHoje}</div>
        </CardIndicador>
        <CardIndicador titulo="Vendas balcao hoje" icone={Store} cor="roxo">
          <div className="text-3xl font-semibold">{vendasBalcaoHoje}</div>
          <div className="text-xs text-slate-400">{formatarMoeda(faturamentoBalcaoHoje)}</div>
        </CardIndicador>
        <CardIndicador titulo="Faturamento do mes" icone={Wallet} cor="verde">
          <div className="text-3xl font-semibold">{formatarMoeda(faturamentoMes)}</div>
        </CardIndicador>
        <CardIndicador titulo="Aguardando pagamento" icone={Clock} cor="ambar">
          <div className="text-3xl font-semibold">{pedidosPendentes}</div>
        </CardIndicador>
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
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{pedido.cliente_nome}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span
                        className={
                          statusExibicao(pedido.status, pedido.criado_em) === "Provavelmente abandonado"
                            ? "text-amber-500"
                            : undefined
                        }
                      >
                        {statusExibicao(pedido.status, pedido.criado_em)}
                      </span>
                      {pedido.forma_pagamento && <span>· {pedido.forma_pagamento}</span>}
                      <LabelCanal canal={pedido.canal ?? (pedido.origem === "balcao" ? "balcao" : "site")} />
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
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
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
