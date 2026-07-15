import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Produtos ativos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Pedidos hoje</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Faturamento do mes</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">R$ 0,00</CardContent>
        </Card>
      </div>
    </div>
  )
}
