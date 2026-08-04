import { query } from "@/lib/db"
import { getConfiguracoes } from "@/lib/configuracoes"
import { RespostaCotacao } from "@/components/loja/resposta-cotacao"

function numeroFormatado(n: number) {
  return `CT.${String(n).padStart(4, "0")}`
}

export default async function ResponderCotacaoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const [cotacao] = await query(
    `SELECT ct.id, ct.numero, ct.status, ct.observacao, f.razao_social AS fornecedor_nome
     FROM TAB_COTACAO ct
     JOIN TAB_FORNECEDOR f ON f.id = ct.fornecedor_id
     WHERE ct.token_resposta = $1`,
    [token]
  )

  if (!cotacao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-500">Cotacao nao encontrada ou link invalido.</p>
      </div>
    )
  }

  const [itens, config] = await Promise.all([
    query(
      `SELECT id, descricao, quantidade_solicitada, quantidade_cotada, valor_unitario_cotado
       FROM TAB_COTACAO_ITEM WHERE cotacao_id = $1 ORDER BY id`,
      [cotacao.id]
    ),
    getConfiguracoes(["nome_loja"]),
  ])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-slate-200 pb-4 text-center">
          <p className="text-lg font-bold text-slate-800">{config.nome_loja || "Cotacao"}</p>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">Cotacao {numeroFormatado(cotacao.numero)}</h1>
          <p className="mt-2 text-sm text-slate-700">{cotacao.fornecedor_nome}</p>
        </div>

        <p className="text-sm text-slate-600">
          Informe a quantidade que consegue entregar e o preco de cada item abaixo.
        </p>

        {cotacao.observacao && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Observacao</h3>
            <p className="text-sm whitespace-pre-line text-slate-600">{cotacao.observacao}</p>
          </div>
        )}

        <RespostaCotacao
          token={token}
          status={cotacao.status}
          itens={itens.map((item) => ({
            id: item.id,
            descricao: item.descricao,
            quantidadeSolicitada: Number(item.quantidade_solicitada),
            quantidadeCotada: item.quantidade_cotada != null ? Number(item.quantidade_cotada) : null,
            valorUnitarioCotado: item.valor_unitario_cotado != null ? Number(item.valor_unitario_cotado) : null,
          }))}
        />
      </div>
    </div>
  )
}
