import { query } from "@/lib/db"
import { getConfiguracoes } from "@/lib/configuracoes"

export type MargemProduto = {
  produto_id: string
  nome: string
  quantidade: number
  faturamento: number
  custo_total: number
  margem: number
  margem_percentual: number
}

export type MargemCategoria = {
  categoria: string
  faturamento: number
  custo_total: number
  margem: number
  margem_percentual: number
}

export type Dre = {
  faturamento: number
  cmv: number
  margemBruta: number
  taxasPagamento: number
  imposto: number
  despesasFixas: number
  lucroLiquido: number
  aliquotaImposto: number
  produtos: MargemProduto[]
  categorias: MargemCategoria[]
}

// Custo Da Mercadoria Vendida (CMV) e margem usam o custo MEDIO ATUAL do
// produto (TAB_PRODUTO.custo), nao um custo historico "congelado" no momento
// da venda - o pedido nao guarda o custo unitario de cada item. Isso e uma
// aproximacao aceitavel pro relatorio gerencial (a maioria dos produtos nao
// muda de custo com frequencia), mas pedidos antigos vendidos antes de uma
// mudanca de custo vao refletir o custo atual, nao o de quando foram vendidos.
export async function calcularDRE(inicioTs: string, fimTs: string, inicioData: string, fimData: string): Promise<Dre> {
  const [
    [totais],
    pedidosPagos,
    produtos,
    categoriasBrutas,
    [despesas],
    config,
  ] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(total), 0) AS faturamento
       FROM TAB_PEDIDO WHERE status = 'pago' AND criado_em BETWEEN $1 AND $2`,
      [inicioTs, fimTs]
    ),
    query(
      `SELECT total, gateway_pagamento FROM TAB_PEDIDO
       WHERE status = 'pago' AND criado_em BETWEEN $1 AND $2`,
      [inicioTs, fimTs]
    ),
    query(
      `SELECT prod.id AS produto_id, prod.nome,
              SUM(pi.quantidade) AS quantidade,
              SUM(pi.quantidade * pi.preco_unitario) AS faturamento,
              SUM(pi.quantidade * prod.custo) AS custo_total
       FROM TAB_PEDIDO_ITEM pi
       JOIN TAB_PEDIDO ped ON ped.id = pi.pedido_id
       JOIN TAB_PRODUTO prod ON prod.id = pi.produto_id
       WHERE ped.status = 'pago' AND ped.criado_em BETWEEN $1 AND $2
       GROUP BY prod.id, prod.nome
       ORDER BY (SUM(pi.quantidade * pi.preco_unitario) - SUM(pi.quantidade * prod.custo)) DESC`,
      [inicioTs, fimTs]
    ),
    // Categoria "sem categoria" entra como null - produto com mais de uma
    // categoria conta o faturamento em cada uma (mesma logica simplificada
    // usada no restante do admin, nao pondera por categoria "principal").
    query(
      `SELECT COALESCE(cat.nome, 'Sem categoria') AS categoria,
              SUM(pi.quantidade * pi.preco_unitario) AS faturamento,
              SUM(pi.quantidade * prod.custo) AS custo_total
       FROM TAB_PEDIDO_ITEM pi
       JOIN TAB_PEDIDO ped ON ped.id = pi.pedido_id
       JOIN TAB_PRODUTO prod ON prod.id = pi.produto_id
       LEFT JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = prod.id
       LEFT JOIN TAB_CATEGORIA cat ON cat.id = pc.categoria_id
       WHERE ped.status = 'pago' AND ped.criado_em BETWEEN $1 AND $2
       GROUP BY cat.nome
       ORDER BY (SUM(pi.quantidade * pi.preco_unitario) - SUM(pi.quantidade * prod.custo)) DESC`,
      [inicioTs, fimTs]
    ),
    // Despesas fixas do periodo - exclui categoria 'compra' de proposito:
    // o custo de mercadoria ja entra no CMV via TAB_PRODUTO.custo, contar a
    // conta a pagar gerada pela compra de novo aqui contaria o custo em dobro.
    query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM TAB_CONTA
       WHERE tipo = 'pagar' AND (categoria IS NULL OR categoria <> 'compra')
         AND vencimento BETWEEN $1::date AND $2::date`,
      [inicioData, fimData]
    ),
    getConfiguracoes([
      "taxa_mercadopago_percentual",
      "taxa_mercadopago_fixo",
      "taxa_pagbank_percentual",
      "taxa_pagbank_fixo",
      "aliquota_imposto_percentual",
    ]),
  ])

  const faturamento = Number(totais.faturamento)
  const cmv = produtos.reduce((soma: number, p: any) => soma + Number(p.custo_total), 0)
  const margemBruta = faturamento - cmv

  const taxaMpPercentual = Number(config.taxa_mercadopago_percentual) || 0
  const taxaMpFixo = Number(config.taxa_mercadopago_fixo) || 0
  const taxaPagbankPercentual = Number(config.taxa_pagbank_percentual) || 0
  const taxaPagbankFixo = Number(config.taxa_pagbank_fixo) || 0
  const aliquotaImposto = Number(config.aliquota_imposto_percentual) || 0

  const taxasPagamento = pedidosPagos.reduce((soma: number, pedido: any) => {
    const total = Number(pedido.total)
    if (pedido.gateway_pagamento === "pagbank") {
      return soma + (total * taxaPagbankPercentual) / 100 + taxaPagbankFixo
    }
    // Sem gateway informado (venda balcao, por exemplo) cai no Mercado Pago -
    // unico gateway usado ate a integracao com PagBank existir.
    return soma + (total * taxaMpPercentual) / 100 + taxaMpFixo
  }, 0)

  const imposto = (faturamento * aliquotaImposto) / 100
  const despesasFixas = Number(despesas.total)
  const lucroLiquido = margemBruta - taxasPagamento - imposto - despesasFixas

  const produtosComMargem: MargemProduto[] = produtos.map((p: any) => {
    const fat = Number(p.faturamento)
    const custo = Number(p.custo_total)
    const margem = fat - custo
    return {
      produto_id: p.produto_id,
      nome: p.nome,
      quantidade: Number(p.quantidade),
      faturamento: fat,
      custo_total: custo,
      margem,
      margem_percentual: fat > 0 ? (margem / fat) * 100 : 0,
    }
  })

  const categoriasComMargem: MargemCategoria[] = categoriasBrutas.map((c: any) => {
    const fat = Number(c.faturamento)
    const custo = Number(c.custo_total)
    const margem = fat - custo
    return {
      categoria: c.categoria,
      faturamento: fat,
      custo_total: custo,
      margem,
      margem_percentual: fat > 0 ? (margem / fat) * 100 : 0,
    }
  })

  return {
    faturamento,
    cmv,
    margemBruta,
    taxasPagamento,
    imposto,
    despesasFixas,
    lucroLiquido,
    aliquotaImposto,
    produtos: produtosComMargem,
    categorias: categoriasComMargem,
  }
}

// Devolve o periodo anterior de mesma duracao, imediatamente antes do
// periodo informado - usado pra comparacao (ex: "mes atual vs mes anterior").
export function periodoAnterior(inicio: string, fim: string): { inicio: string; fim: string } {
  const dataInicio = new Date(`${inicio}T00:00:00`)
  const dataFim = new Date(`${fim}T00:00:00`)
  const duracaoDias = Math.round((dataFim.getTime() - dataInicio.getTime()) / 86_400_000) + 1

  const novoFim = new Date(dataInicio.getTime() - 86_400_000)
  const novoInicio = new Date(novoFim.getTime() - (duracaoDias - 1) * 86_400_000)

  return {
    inicio: novoInicio.toISOString().slice(0, 10),
    fim: novoFim.toISOString().slice(0, 10),
  }
}
