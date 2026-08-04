import { Card, CardContent } from "@/components/ui/card"
import { formatarMoeda } from "@/lib/mascaras"

type Assinatura = {
  id: string
  status: "pendente" | "autorizada" | "pausada" | "cancelada"
  valor_mensalidade: string
  proximo_vencimento: string | null
  criado_em: string
  cliente_nome: string
  cliente_email: string
}

const STATUS_ESTILO: Record<Assinatura["status"], string> = {
  pendente: "bg-amber-500/20 text-amber-500",
  autorizada: "bg-emerald-600/20 text-emerald-400",
  pausada: "bg-slate-200 text-slate-500",
  cancelada: "bg-red-500/10 text-red-400",
}

const STATUS_LABEL: Record<Assinatura["status"], string> = {
  pendente: "Pendente",
  autorizada: "Ativa",
  pausada: "Pausada",
  cancelada: "Cancelada",
}

// So leitura - a assinatura e criada/cancelada pelo proprio cliente em Minha
// Conta (cobranca real via Mercado Pago), o admin so acompanha aqui.
export function ClubeConteudo({ assinaturas }: { assinaturas: Assinatura[] }) {
  const ativos = assinaturas.filter((a) => a.status === "autorizada").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clube</h1>
        <p className="text-sm text-slate-500">{ativos} assinante(s) ativo(s) no momento</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {assinaturas.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhuma assinatura do Clube ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Cliente</th>
                    <th className="p-4 font-medium">Mensalidade</th>
                    <th className="p-4 font-medium">Próxima cobrança</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assinaturas.map((a) => (
                    <tr key={a.id} className="border-b border-slate-200 last:border-0">
                      <td className="p-4">
                        <span className="font-medium">{a.cliente_nome}</span>
                        <span className="block text-xs text-slate-400">{a.cliente_email}</span>
                      </td>
                      <td className="p-4 text-slate-500">{formatarMoeda(a.valor_mensalidade)}</td>
                      <td className="p-4 text-slate-500">
                        {a.proximo_vencimento
                          ? new Date(a.proximo_vencimento).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-1 text-xs ${STATUS_ESTILO[a.status]}`}>
                          {STATUS_LABEL[a.status]}
                        </span>
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
