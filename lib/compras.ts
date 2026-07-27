import { transacao, query } from "@/lib/db"

// Marca uma compra como recebida: da alta no estoque de cada item, recalcula
// o custo medio ponderado do produto e gera automaticamente uma conta a
// pagar (TAB_CONTA) vinculada a compra. Tudo dentro de uma transacao com
// "FOR UPDATE" na compra e nos produtos - mesmo padrao do webhook do
// Mercado Pago, pra nunca dar baixa duplicada em reenvios/cliques repetidos.
export async function receberCompra(compraId: string) {
  return transacao(async (q) => {
    const [compra] = await q(
      "SELECT id, fornecedor_id, numero_nota, status, valor_frete, data_compra FROM TAB_COMPRA WHERE id = $1 FOR UPDATE",
      [compraId]
    )

    if (!compra) {
      throw new Error("Compra nao encontrada")
    }
    if (compra.status !== "pendente") {
      throw new Error("Esta compra ja foi recebida ou esta cancelada")
    }

    const itens = await q(
      "SELECT produto_id, quantidade, custo_unitario FROM TAB_COMPRA_ITEM WHERE compra_id = $1",
      [compraId]
    )

    let valorItens = 0

    for (const item of itens) {
      const [produto] = await q(
        "SELECT id, estoque, custo FROM TAB_PRODUTO WHERE id = $1 FOR UPDATE",
        [item.produto_id]
      )
      if (!produto) continue

      const estoqueAtual = Number(produto.estoque)
      const custoAtual = Number(produto.custo)
      const quantidade = Number(item.quantidade)
      const custoUnitario = Number(item.custo_unitario)

      const novoEstoque = estoqueAtual + quantidade
      // Media ponderada pelo estoque existente - se o produto nunca teve
      // estoque/custo antes, o custo novo vira exatamente o da compra.
      const novoCusto =
        novoEstoque > 0
          ? (estoqueAtual * custoAtual + quantidade * custoUnitario) / novoEstoque
          : custoUnitario

      await q("UPDATE TAB_PRODUTO SET estoque = $1, custo = $2, atualizado_em = NOW() WHERE id = $3", [
        novoEstoque,
        novoCusto,
        item.produto_id,
      ])

      valorItens += quantidade * custoUnitario
    }

    const valorTotal = valorItens + Number(compra.valor_frete)

    const [fornecedor] = await q("SELECT razao_social FROM TAB_FORNECEDOR WHERE id = $1", [
      compra.fornecedor_id,
    ])

    const [conta] = await q(
      `INSERT INTO TAB_CONTA (tipo, descricao, valor, vencimento, categoria, observacao)
       VALUES ('pagar', $1, $2, $3, 'compra', $4)
       RETURNING id`,
      [
        `Compra${compra.numero_nota ? ` NF ${compra.numero_nota}` : ""} - ${fornecedor?.razao_social ?? "Fornecedor"}`,
        valorTotal,
        compra.data_compra,
        `Gerada automaticamente ao receber a compra ${compra.id}`,
      ]
    )

    const [compraAtualizada] = await q(
      `UPDATE TAB_COMPRA SET status = 'recebida', conta_id = $1, atualizado_em = NOW()
       WHERE id = $2 RETURNING id, status, conta_id`,
      [conta.id, compraId]
    )

    return compraAtualizada
  })
}

export async function listarCompras() {
  return query(
    `SELECT c.id, c.numero_nota, c.status, c.valor_frete, c.data_compra, c.criado_em,
            f.razao_social AS fornecedor_nome,
            COALESCE(SUM(ci.quantidade * ci.custo_unitario), 0) AS valor_itens
     FROM TAB_COMPRA c
     JOIN TAB_FORNECEDOR f ON f.id = c.fornecedor_id
     LEFT JOIN TAB_COMPRA_ITEM ci ON ci.compra_id = c.id
     GROUP BY c.id, f.razao_social
     ORDER BY c.criado_em DESC`
  )
}
