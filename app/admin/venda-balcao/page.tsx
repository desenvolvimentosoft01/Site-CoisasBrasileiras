import { query } from "@/lib/db"
import { VendaBalcaoConteudo } from "@/components/admin/venda-balcao-conteudo"

export default async function VendaBalcaoPage() {
  const [produtos, clientes, tiposEntrega, vendas] = await Promise.all([
    query(`
      SELECT
        p.id, p.nome, p.preco, p.preco_promocional, p.estoque,
        COALESCE(
          json_agg(DISTINCT c.nome) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS categorias,
        (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_url
      FROM TAB_PRODUTO p
      LEFT JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id
      LEFT JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id
      WHERE p.ativo = true
      GROUP BY p.id
      ORDER BY p.nome
    `),
    query("SELECT id, nome, email, telefone FROM TAB_CLIENTE ORDER BY nome"),
    query("SELECT id, nome FROM TAB_TIPO_ENTREGA WHERE ativo = true ORDER BY nome"),
    // Conferencia do que foi lancado AQUI nos ultimos dias - e nao a listagem
    // geral de pedidos, que vive na tela Pedidos. Esta aba responde "o que eu
    // vendi hoje?", e nao "onde esta aquele pedido do mes passado?"; antes ela
    // repetia a listagem inteira e as duas telas pareciam a mesma coisa.
    query(`
      SELECT p.id, p.origem, p.canal, p.marca, p.status, p.total, p.forma_pagamento, p.criado_em,
        COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente avulso') AS cliente_nome
      FROM TAB_PEDIDO p
      LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
      WHERE p.origem = 'balcao' AND p.criado_em >= NOW() - INTERVAL '7 days'
      ORDER BY p.criado_em DESC
      LIMIT 100
    `),
  ])

  return (
    <VendaBalcaoConteudo
      produtosIniciais={produtos}
      clientesIniciais={clientes}
      tiposEntregaIniciais={tiposEntrega}
      vendasIniciais={vendas}
    />
  )
}
