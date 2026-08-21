// Registro de movimentação de estoque (kardex) — migration 062.
//
// Toda alteração de estoque passa por aqui, e não só a manual: sem isso o
// histórico teria buracos justamente nas movimentações automáticas (venda,
// compra recebida), que são a maioria.
//
// A função recebe a função de query da transação em curso (`q`), e não abre
// transação própria: o movimento tem que ser gravado na MESMA transação que
// mexeu no saldo. Se fossem duas, uma falha no meio deixaria saldo sem
// histórico — ou histórico de um movimento que não aconteceu.

export type MotivoMovimento =
  | "compra"
  | "venda"
  | "cancelamento_venda"
  | "ajuste"
  | "inventario"
  | "quebra"
  | "perda"
  | "devolucao"

export const ROTULO_MOTIVO: Record<MotivoMovimento, string> = {
  compra: "Entrada de NF",
  venda: "Venda",
  cancelamento_venda: "Cancelamento de venda",
  ajuste: "Ajuste manual",
  inventario: "Inventário (contagem)",
  quebra: "Quebra",
  perda: "Perda / extravio",
  devolucao: "Devolução do cliente",
}

// Motivos que o operador pode escolher num ajuste manual. Os demais são
// gerados pelo próprio sistema a partir de um documento e não fazem sentido
// como escolha na tela.
export const MOTIVOS_AJUSTE_MANUAL: MotivoMovimento[] = [
  "inventario",
  "quebra",
  "perda",
  "devolucao",
  "ajuste",
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a query da transacao devolve linhas de forma variavel por chamador
type QueryTransacao = (sql: string, params?: unknown[]) => Promise<any[]>

export async function registrarMovimentoEstoque(
  q: QueryTransacao,
  dados: {
    produtoId: string
    quantidade: number
    tipo: "entrada" | "saida"
    motivo: MotivoMovimento
    // Saldo do produto DEPOIS do movimento. Quem chama já tem esse número em
    // mãos (acabou de atualizar o saldo), e guardá-lo aqui é o que permite
    // conferir a conta depois sem refazer a soma desde o início.
    saldoApos: number
    origemTipo?: string | null
    origemId?: string | null
    usuarioId?: string | null
    observacao?: string | null
  }
) {
  // Movimento de quantidade zero não é movimento: gravaria linha sem
  // significado e ainda quebraria o CHECK da tabela.
  if (!dados.quantidade || dados.quantidade <= 0) return

  await q(
    `INSERT INTO TAB_ESTOQUE_MOVIMENTO
       (produto_id, quantidade, tipo, motivo, saldo_apos, origem_tipo, origem_id, usuario_id, observacao)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      dados.produtoId,
      Math.round(dados.quantidade),
      dados.tipo,
      dados.motivo,
      dados.saldoApos,
      dados.origemTipo ?? null,
      dados.origemId ?? null,
      dados.usuarioId ?? null,
      dados.observacao ?? null,
    ]
  )
}
