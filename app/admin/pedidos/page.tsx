import { query } from "@/lib/db"
import { PedidosConteudo } from "@/components/admin/pedidos-conteudo"

export default async function PedidosPage() {
  // LEFT JOIN porque pedidos de venda balcao podem nao ter cliente com conta
  // no site vinculado (cliente_id nulo) - nesse caso usa o nome avulso digitado
  // na hora da venda.
  const pedidos = await query(`
    SELECT p.id, p.status, p.total, p.origem, p.criado_em,
      COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente avulso') AS cliente_nome
    FROM TAB_PEDIDO p
    LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
    ORDER BY p.criado_em DESC
  `)

  return <PedidosConteudo pedidosIniciais={pedidos} />
}
