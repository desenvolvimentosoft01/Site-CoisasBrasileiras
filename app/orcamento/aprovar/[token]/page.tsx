import { query } from "@/lib/db"
import { getConfiguracoes } from "@/lib/configuracoes"
import { formatarMoeda } from "@/lib/mascaras"
import { RespostaOrcamento } from "@/components/loja/resposta-orcamento"

function numeroFormatado(n: number) {
  return `OR.${String(n).padStart(4, "0")}`
}

export default async function AprovarOrcamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ canal?: string }>
}) {
  const { token } = await params
  const { canal } = await searchParams

  const [orcamento] = await query(
    `SELECT id, numero, titulo, cliente_nome, condicoes, status, subtotal, desconto, total,
       canal_resposta, observacao_cliente
     FROM TAB_ORCAMENTO WHERE token_aprovacao = $1`,
    [token]
  )

  if (!orcamento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-500">Orcamento nao encontrado ou link invalido.</p>
      </div>
    )
  }

  const [itens, config] = await Promise.all([
    query(
      `SELECT id, descricao, quantidade, valor_unitario, subtotal
       FROM TAB_ORCAMENTO_ITEM WHERE orcamento_id = $1 ORDER BY id`,
      [orcamento.id]
    ),
    getConfiguracoes(["nome_loja"]),
  ])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-slate-200 pb-4 text-center">
          <p className="text-lg font-bold text-slate-800">{config.nome_loja || "Orcamento"}</p>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">{orcamento.titulo || "Orcamento"}</h1>
          <p className="text-sm text-slate-500">{numeroFormatado(orcamento.numero)}</p>
          <p className="mt-2 text-sm text-slate-700">{orcamento.cliente_nome}</p>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-right">Qtde.</th>
              <th className="py-2 text-right">Valor unit.</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-b border-slate-200">
                <td className="py-2">{item.descricao}</td>
                <td className="py-2 text-right">{Number(item.quantidade)}</td>
                <td className="py-2 text-right">{formatarMoeda(item.valor_unitario)}</td>
                <td className="py-2 text-right font-semibold">{formatarMoeda(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col items-end gap-0.5">
          {Number(orcamento.desconto) > 0 && (
            <>
              <p className="text-sm text-slate-500">Subtotal: {formatarMoeda(orcamento.subtotal)}</p>
              <p className="text-sm text-slate-500">Desconto: -{formatarMoeda(orcamento.desconto)}</p>
            </>
          )}
          <p className="text-lg font-bold">Total: {formatarMoeda(orcamento.total)}</p>
        </div>

        {orcamento.condicoes && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Condicoes</h3>
            <p className="text-sm whitespace-pre-line text-slate-600">{orcamento.condicoes}</p>
          </div>
        )}

        <RespostaOrcamento
          token={token}
          canal={canal === "whatsapp" ? "whatsapp" : "email"}
          statusAtual={orcamento.status}
          canalResposta={orcamento.canal_resposta}
          observacaoCliente={orcamento.observacao_cliente}
        />
      </div>
    </div>
  )
}
