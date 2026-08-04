import { query, transacao } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [compra] = await query(
    `SELECT c.id, c.fornecedor_id, c.numero_nota, c.chave_acesso, c.status, c.valor_frete, c.data_compra,
            c.data_vencimento, c.observacao, c.conta_id, c.criado_em, f.razao_social AS fornecedor_nome
     FROM TAB_COMPRA c JOIN TAB_FORNECEDOR f ON f.id = c.fornecedor_id
     WHERE c.id = $1`,
    [id]
  )

  if (!compra) {
    return NextResponse.json({ erro: "Compra não encontrada" }, { status: 404 })
  }

  const itens = await query(
    `SELECT ci.id, ci.produto_id, ci.quantidade, ci.custo_unitario, p.nome AS produto_nome
     FROM TAB_COMPRA_ITEM ci JOIN TAB_PRODUTO p ON p.id = ci.produto_id
     WHERE ci.compra_id = $1`,
    [id]
  )

  return NextResponse.json({ ...compra, itens })
}

// So permite editar compra "pendente" - uma vez recebida, ja afetou
// estoque/custo/financeiro (ver lib/compras.ts receberCompra), editar os
// itens depois deixaria esses dados dessincronizados.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const dados = await request.json()
  const { fornecedorId, numeroNota, chaveAcesso, valorFrete, dataCompra, dataVencimento, observacao, itens } = dados

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

  const [compraAtual] = await query("SELECT status FROM TAB_COMPRA WHERE id = $1", [id])
  if (!compraAtual) {
    return NextResponse.json({ erro: "Compra não encontrada" }, { status: 404 })
  }
  if (compraAtual.status !== "pendente") {
    return NextResponse.json({ erro: "Só é possível editar uma compra pendente" }, { status: 409 })
  }

  const compra = await transacao(async (q) => {
    const [compraAtualizada] = await q(
      `UPDATE TAB_COMPRA
       SET fornecedor_id = $1, numero_nota = $2, chave_acesso = $3, valor_frete = $4,
           data_compra = $5, data_vencimento = $6, observacao = $7, atualizado_em = NOW()
       WHERE id = $8
       RETURNING id, fornecedor_id, numero_nota, chave_acesso, status, valor_frete, data_compra, data_vencimento, observacao`,
      [
        fornecedorId,
        numeroNota || null,
        chaveAcesso ? String(chaveAcesso).replace(/\D/g, "") : null,
        Number(valorFrete) || 0,
        dataCompra || new Date(),
        dataVencimento || null,
        observacao || null,
        id,
      ]
    )

    await q("DELETE FROM TAB_COMPRA_ITEM WHERE compra_id = $1", [id])
    for (const item of itens) {
      await q(
        "INSERT INTO TAB_COMPRA_ITEM (compra_id, produto_id, quantidade, custo_unitario) VALUES ($1, $2, $3, $4)",
        [id, item.produtoId, Number(item.quantidade), Number(item.custoUnitario)]
      )
    }

    return compraAtualizada
  })

  return NextResponse.json(compra)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [compra] = await query("SELECT status FROM TAB_COMPRA WHERE id = $1", [id])
  if (!compra) {
    return NextResponse.json({ erro: "Compra não encontrada" }, { status: 404 })
  }
  if (compra.status === "recebida") {
    return NextResponse.json(
      { erro: "Compra já recebida não pode ser excluída (já afetou estoque/custo/financeiro). Use cancelar se aplicável." },
      { status: 409 }
    )
  }

  await query("DELETE FROM TAB_COMPRA WHERE id = $1", [id])
  return NextResponse.json({ sucesso: true })
}
