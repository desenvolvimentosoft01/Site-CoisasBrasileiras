import { query, transacao } from "@/lib/db"
import { listarCompras } from "@/lib/compras"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const compras = await listarCompras()
  return NextResponse.json(compras)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const dados = await request.json()
  const {
    fornecedorId,
    numeroNota,
    serie,
    chaveAcesso,
    valorFrete,
    dataCompra,
    dataVencimento,
    observacao,
    itens,
    blingNotaId,
    pedidoCompraId,
    xmlNfe,
    dataEmissao,
    valorTotalNota,
  } = dados

  if (!fornecedorId) {
    return NextResponse.json({ erro: "Fornecedor é obrigatório" }, { status: 400 })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: "Adicione pelo menos um item" }, { status: 400 })
  }
  for (const item of itens) {
    if (!item.produtoId || !(Number(item.quantidade) > 0) || Number(item.custoUnitario) < 0) {
      return NextResponse.json({ erro: "Item inválido: confira produto, quantidade e custo" }, { status: 400 })
    }
  }

  // A chave de acesso identifica a nota de forma unica, entao chave repetida
  // e sempre a mesma nota sendo lancada duas vezes - erro comum quando o
  // mesmo XML e importado de novo dias depois. Checado aqui (e nao por
  // constraint no banco) pra devolver uma mensagem que o operador entenda.
  const chaveNormalizada = chaveAcesso ? String(chaveAcesso).replace(/\D/g, "") : null
  if (chaveNormalizada) {
    const [jaLancada] = await query(
      "SELECT numero_nota FROM TAB_COMPRA WHERE chave_acesso = $1 AND status <> 'cancelada' LIMIT 1",
      [chaveNormalizada]
    )
    if (jaLancada) {
      return NextResponse.json(
        { erro: `Essa nota já foi lançada (nº ${jaLancada.numero_nota || "sem número"}). Confira em Compras antes de lançar de novo.` },
        { status: 409 }
      )
    }
  }

  // Compra + itens numa unica transacao - sem isso, uma falha no meio do
  // loop de itens deixava uma compra "orfa" com itens incompletos no banco.
  const compra = await transacao(async (q) => {
    const [novaCompra] = await q(
      `INSERT INTO TAB_COMPRA (fornecedor_id, numero_nota, chave_acesso, valor_frete, data_compra, data_vencimento, observacao, bling_nota_id, pedido_compra_id, xml_nfe, data_emissao, valor_total_nota, serie)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, fornecedor_id, numero_nota, chave_acesso, status, valor_frete, data_compra, data_vencimento, observacao, criado_em`,
      [
        fornecedorId,
        numeroNota || null,
        chaveNormalizada,
        Number(valorFrete) || 0,
        dataCompra || new Date(),
        dataVencimento || null,
        observacao || null,
        blingNotaId || null,
        pedidoCompraId || null,
        // Guarda o XML so quando a entrada veio de importacao - nota lancada
        // na mao nao tem arquivo, e ai a coluna fica nula mesmo.
        typeof xmlNfe === "string" && xmlNfe.length > 0 ? xmlNfe : null,
        dataEmissao || null,
        Number(valorTotalNota) > 0 ? Number(valorTotalNota) : null,
        serie || null,
      ]
    )

    for (const item of itens) {
      await q(
        "INSERT INTO TAB_COMPRA_ITEM (compra_id, produto_id, quantidade, custo_unitario) VALUES ($1, $2, $3, $4)",
        [novaCompra.id, item.produtoId, Number(item.quantidade), Number(item.custoUnitario)]
      )
    }

    if (pedidoCompraId) {
      await q(
        "UPDATE TAB_PEDIDO_COMPRA SET status = 'atendido', atualizado_em = NOW() WHERE id = $1",
        [pedidoCompraId]
      )
    }

    return novaCompra
  })

  return NextResponse.json(compra, { status: 201 })
}
