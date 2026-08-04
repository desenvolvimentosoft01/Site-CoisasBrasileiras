import { query } from "@/lib/db"
import { listarCompras } from "@/lib/compras"
import { ComprasConteudo } from "@/components/admin/compras-conteudo"

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ pedidoCompraId?: string }>
}) {
  const { pedidoCompraId } = await searchParams

  const [compras, fornecedores, produtos, pedidoCompra] = await Promise.all([
    listarCompras(),
    query("SELECT id, razao_social, cnpj_cpf FROM TAB_FORNECEDOR WHERE ativo = true ORDER BY razao_social"),
    query("SELECT id, nome, sku, codigo_barras, custo, estoque FROM TAB_PRODUTO WHERE ativo = true ORDER BY nome"),
    pedidoCompraId
      ? query(
          `SELECT pc.id, pc.numero, pc.fornecedor_id
           FROM TAB_PEDIDO_COMPRA pc WHERE pc.id = $1 AND pc.status != 'atendido'`,
          [pedidoCompraId]
        )
      : Promise.resolve([]),
  ])

  let pedidoCompraParaLancar = null
  if (pedidoCompra[0]) {
    const [itens, itensSemProduto] = await Promise.all([
      query(
        `SELECT produto_id, descricao, quantidade, custo_unitario
         FROM TAB_PEDIDO_COMPRA_ITEM WHERE pedido_compra_id = $1 AND produto_id IS NOT NULL ORDER BY id`,
        [pedidoCompraId]
      ),
      query(
        `SELECT COUNT(*)::int AS total FROM TAB_PEDIDO_COMPRA_ITEM WHERE pedido_compra_id = $1 AND produto_id IS NULL`,
        [pedidoCompraId]
      ),
    ])
    pedidoCompraParaLancar = { ...pedidoCompra[0], itens, qtdItensSemProduto: itensSemProduto[0].total }
  }

  return (
    <ComprasConteudo
      comprasIniciais={compras}
      fornecedores={fornecedores}
      produtos={produtos}
      pedidoCompraParaLancar={pedidoCompraParaLancar}
    />
  )
}
