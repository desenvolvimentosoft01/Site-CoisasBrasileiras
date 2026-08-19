import { query } from "@/lib/db"
import { PedidosCompraConteudo } from "@/components/admin/pedidos-compra-conteudo"

export default async function PedidosCompraPage() {
  const [pedidos, fornecedores, produtos] = await Promise.all([
    query(
      `SELECT pc.id, pc.numero, pc.status, pc.observacao, pc.valor_total, pc.desconto, pc.enviado_email_em,
         pc.criado_em, pc.fornecedor_id, f.razao_social AS fornecedor_nome, f.email AS fornecedor_email,
         f.telefone AS fornecedor_telefone
       FROM TAB_PEDIDO_COMPRA pc
       JOIN TAB_FORNECEDOR f ON f.id = pc.fornecedor_id
       ORDER BY pc.criado_em DESC`
    ),
    query(
      "SELECT id, razao_social, nome_fantasia, cnpj_cpf, email, telefone FROM TAB_FORNECEDOR WHERE ativo = true ORDER BY razao_social"
    ),
    query("SELECT id, nome, sku, custo FROM TAB_PRODUTO WHERE ativo = true ORDER BY nome"),
  ])

  return <PedidosCompraConteudo pedidosIniciais={pedidos} fornecedores={fornecedores} produtos={produtos} />
}
