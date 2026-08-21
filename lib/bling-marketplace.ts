import { query, transacao } from "@/lib/db"
import { getConfiguracoes } from "@/lib/configuracoes"
import { listarPedidosVendaMarketplace, obterPedidoVendaBling } from "@/lib/bling"
import type { CanalPedido } from "@/lib/canal-pedido"
import { registrarMovimentoEstoque } from "@/lib/estoque-movimento"

// Importa pedidos de Mercado Livre e Shopee que chegam no Bling como
// TAB_PEDIDO de verdade aqui - com cliente, endereco, itens e baixa de
// estoque, igual um pedido nascido no site/balcao. Ver plano em
// C:\Users\Lucas\.claude\plans\bright-juggling-canyon.md pro contexto
// completo da decisao de desenho.
//
// SITUACAO_CANCELADA: mesma lista usada pra notas de entrada (2 Cancelada,
// 4 Rejeitada, 9 Denegada, 11 Bloqueada) - nao ha o que importar nesses casos.
const SITUACOES_SEM_IMPORTACAO = [2, 4, 9, 11]

const CANAIS_MARKETPLACE: { canal: CanalPedido; chaveConfig: string }[] = [
  { canal: "mercadolivre", chaveConfig: "bling_loja_mercadolivre" },
  { canal: "shopee", chaveConfig: "bling_loja_shopee" },
]

export type ResultadoImportacaoMarketplace = {
  importados: number
  pendentes: number
  erro?: string
}

export async function importarPedidosMarketplace(): Promise<ResultadoImportacaoMarketplace> {
  const config = await getConfiguracoes(CANAIS_MARKETPLACE.map((c) => c.chaveConfig))

  let importados = 0
  let pendentes = 0

  // Ultimos 30 dias - suficiente pra pegar qualquer pedido que passou batido
  // em execucoes anteriores do cron, sem varrer o historico inteiro toda vez.
  const dataInicial = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  for (const { canal, chaveConfig } of CANAIS_MARKETPLACE) {
    const idLoja = config[chaveConfig]
    if (!idLoja) continue

    const resumos = await listarPedidosVendaMarketplace({ idLoja, dataInicial })
    const idsRelevantes = resumos
      .filter((r) => !SITUACOES_SEM_IMPORTACAO.includes(r.situacao))
      .map((r) => r.id)
    if (idsRelevantes.length === 0) continue

    const [jaImportados, jaPendentes] = await Promise.all([
      query("SELECT bling_pedido_id FROM TAB_PEDIDO WHERE bling_pedido_id = ANY($1)", [idsRelevantes]),
      query("SELECT bling_pedido_id FROM TAB_BLING_PEDIDO_PENDENTE WHERE bling_pedido_id = ANY($1)", [
        idsRelevantes,
      ]),
    ])
    const idsIgnorar = new Set([
      ...jaImportados.map((p) => p.bling_pedido_id),
      ...jaPendentes.map((p) => p.bling_pedido_id),
    ])

    for (const id of idsRelevantes) {
      if (idsIgnorar.has(id)) continue

      const resultado = await importarUmPedido(id, canal)
      if (resultado === "importado") importados++
      if (resultado === "pendente") pendentes++
    }
  }

  return { importados, pendentes }
}

async function importarUmPedido(blingPedidoId: string, canal: CanalPedido): Promise<"importado" | "pendente"> {
  const detalhe = await obterPedidoVendaBling(blingPedidoId)

  if (detalhe.itens.length === 0) {
    await registrarPendencia(blingPedidoId, canal, "Pedido sem itens retornados pelo Bling")
    return "pendente"
  }

  try {
    await transacao(async (executar) => {
      // Casa cada item por SKU ou codigo de barras - aborta o pedido inteiro
      // (a transacao inteira e desfeita) se algum item nao bater com produto
      // local ou o estoque local for insuficiente, em vez de importar um
      // pedido incompleto.
      const itensCasados: { produtoId: string; quantidade: number; precoUnitario: number }[] = []
      let total = 0

      for (const item of detalhe.itens) {
        const identificador = item.sku || item.codigoBarras
        if (!identificador) {
          throw new Error(`Item "${item.descricao}" sem SKU nem codigo de barras no Bling`)
        }

        const [produto] = await executar(
          "SELECT id, nome, estoque FROM TAB_PRODUTO WHERE sku = $1 OR codigo_barras = $1 FOR UPDATE",
          [identificador]
        )
        if (!produto) {
          throw new Error(`Nenhum produto local com SKU/codigo de barras "${identificador}" (item "${item.descricao}")`)
        }
        if (produto.estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para "${produto.nome}" (disponivel: ${produto.estoque})`)
        }

        itensCasados.push({ produtoId: produto.id, quantidade: item.quantidade, precoUnitario: item.valorUnitario })
        total += item.quantidade * item.valorUnitario
      }

      // Cliente do marketplace nao tem login neste sistema - mesmo padrao ja
      // usado pro cliente avulso da Venda Balcao (sem senha_hash).
      const [clienteCriado] = await executar(
        `INSERT INTO TAB_CLIENTE (nome, email, telefone, cpf_cnpj)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [detalhe.contato.nome, detalhe.contato.email, detalhe.contato.telefone, detalhe.contato.documento]
      )

      let enderecoId: string | null = null
      if (detalhe.endereco) {
        const [enderecoCriado] = await executar(
          `INSERT INTO TAB_ENDERECO (cliente_id, cep, logradouro, numero, complemento, bairro, cidade, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            clienteCriado.id,
            detalhe.endereco.cep,
            detalhe.endereco.logradouro,
            detalhe.endereco.numero,
            detalhe.endereco.complemento,
            detalhe.endereco.bairro,
            detalhe.endereco.cidade,
            detalhe.endereco.estado,
          ]
        )
        enderecoId = enderecoCriado.id
      }

      const [pedidoCriado] = await executar(
        `INSERT INTO TAB_PEDIDO
           (cliente_id, endereco_id, status, total, forma_pagamento, origem, canal, bling_pedido_id,
            bling_nota_id, bling_link_danfe, bling_link_pdf)
         VALUES ($1, $2, 'pago', $3, $4, 'site', $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          clienteCriado.id,
          enderecoId,
          total,
          canal === "mercadolivre" ? "Mercado Livre" : "Shopee",
          canal,
          blingPedidoId,
          detalhe.blingNotaId,
          detalhe.linkDanfe,
          detalhe.linkPdf,
        ]
      )

      for (const item of itensCasados) {
        await executar(
          "INSERT INTO TAB_PEDIDO_ITEM (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
          [pedidoCriado.id, item.produtoId, item.quantidade, item.precoUnitario]
        )
        const [produtoAtualizado] = await executar(
          "UPDATE TAB_PRODUTO SET estoque = estoque - $1 WHERE id = $2 RETURNING estoque",
          [item.quantidade, item.produtoId]
        )
        // Sem usuarioId: quem baixou foi a importacao automatica, e nao uma
        // pessoa - e essa diferenca importa na hora de investigar.
        await registrarMovimentoEstoque(executar, {
          produtoId: item.produtoId,
          quantidade: Number(item.quantidade),
          tipo: "saida",
          motivo: "venda",
          saldoApos: Number(produtoAtualizado?.estoque ?? 0),
          origemTipo: "pedido",
          origemId: pedidoCriado.id,
          observacao: "Pedido importado do marketplace",
        })
      }

      await executar(
        `INSERT INTO TAB_AUDITORIA (usuario_nome, tela, acao, tabela, registro_id, dados_depois)
         VALUES ($1, 'Pedidos', 'cadastro', 'TAB_PEDIDO', $2, $3)`,
        [
          `Importacao Bling (${canal})`,
          pedidoCriado.id,
          { total, canal, bling_pedido_id: blingPedidoId, itens: itensCasados.length },
        ]
      )
    })

    return "importado"
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido ao importar pedido"
    await registrarPendencia(blingPedidoId, canal, mensagem)
    return "pendente"
  }
}

async function registrarPendencia(blingPedidoId: string, canal: CanalPedido, motivo: string): Promise<void> {
  await query(
    `INSERT INTO TAB_BLING_PEDIDO_PENDENTE (bling_pedido_id, canal, motivo)
     VALUES ($1, $2, $3)
     ON CONFLICT (bling_pedido_id) DO UPDATE SET motivo = $3, detectado_em = NOW()`,
    [blingPedidoId, canal, motivo]
  )
}

export type PedidoPendenteMarketplace = {
  id: string
  blingPedidoId: string
  canal: string
  motivo: string
  detectadoEm: string
}

export async function listarPedidosPendentesMarketplace(): Promise<PedidoPendenteMarketplace[]> {
  const linhas = await query(
    "SELECT id, bling_pedido_id, canal, motivo, detectado_em FROM TAB_BLING_PEDIDO_PENDENTE ORDER BY detectado_em DESC"
  )
  return linhas.map((l) => ({
    id: l.id,
    blingPedidoId: l.bling_pedido_id,
    canal: l.canal,
    motivo: l.motivo,
    detectadoEm: l.detectado_em,
  }))
}

export async function descartarPedidoPendenteMarketplace(id: string): Promise<void> {
  await query("DELETE FROM TAB_BLING_PEDIDO_PENDENTE WHERE id = $1", [id])
}
