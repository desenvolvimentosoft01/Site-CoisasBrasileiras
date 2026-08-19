import { query } from "@/lib/db"
import { getSegredo } from "@/lib/segredos"

// Integracao com o Bling - SOMENTE emissao de NF-e a partir de um pedido ja
// pago. Nao sincroniza estoque nem financeiro com o Bling (esse controle
// continua so neste sistema) - escopo combinado explicitamente com o cliente.
//
// Autenticacao OAuth2 (fluxo "authorization code"): o dono da loja conecta a
// conta do Bling uma vez (fluxo iniciado em /api/admin/bling/conectar), e a
// partir dai os tokens ficam guardados em TAB_INTEGRACAO_BLING - nunca no
// client, nunca em log, nunca junto de TAB_CONFIGURACAO (que e devolvida
// inteira pela tela de Configuracoes).
//
// client_id/client_secret seguem o mesmo padrao de Frenet/Mercado Pago/Email
// (lib/segredos.ts): configuraveis pelo admin em Configuracoes > Integracoes,
// guardados em TAB_INTEGRACAO_SEGREDO, com fallback pra variavel de ambiente.

const BLING_API_URL = "https://api.bling.com.br/Api/v3"
const BLING_AUTH_URL = "https://www.bling.com.br/Api/v3/oauth/authorize"
const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token"

async function obterCredenciais(): Promise<{ clientId: string; clientSecret: string }> {
  const [clientId, clientSecret] = await Promise.all([
    getSegredo("bling_client_id"),
    getSegredo("bling_client_secret"),
  ])
  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do Bling não configuradas")
  }
  return { clientId, clientSecret }
}

export async function montarUrlAutorizacaoBling(redirectUri: string, state: string): Promise<string> {
  const { clientId } = await obterCredenciais()
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    state,
    redirect_uri: redirectUri,
  })
  return `${BLING_AUTH_URL}?${params.toString()}`
}

async function salvarTokens(dados: { access_token: string; refresh_token: string; expires_in: number }) {
  const expiraEm = new Date(Date.now() + dados.expires_in * 1000)

  const [existente] = await query("SELECT id FROM TAB_INTEGRACAO_BLING LIMIT 1")
  if (existente) {
    await query(
      `UPDATE TAB_INTEGRACAO_BLING
       SET access_token = $1, refresh_token = $2, expira_em = $3, atualizado_em = NOW()
       WHERE id = $4`,
      [dados.access_token, dados.refresh_token, expiraEm, existente.id]
    )
  } else {
    await query(
      `INSERT INTO TAB_INTEGRACAO_BLING (access_token, refresh_token, expira_em)
       VALUES ($1, $2, $3)`,
      [dados.access_token, dados.refresh_token, expiraEm]
    )
  }
}

// Troca o "code" recebido no callback OAuth pelos tokens de acesso, e ja
// salva no banco. Chamado uma unica vez, quando o dono da loja conecta a
// conta do Bling pela primeira vez.
export async function trocarCodigoPorTokenBling(code: string, redirectUri: string) {
  const { clientId, clientSecret } = await obterCredenciais()

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const resposta = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!resposta.ok) {
    throw new Error(`Falha ao trocar code por token no Bling: ${resposta.status}`)
  }

  const dados = await resposta.json()
  await salvarTokens(dados)
}

// Devolve um access_token valido, renovando via refresh_token automaticamente
// se estiver perto de expirar. Lanca erro se a loja nunca conectou o Bling.
async function obterTokenValido(): Promise<string> {
  const { clientId, clientSecret } = await obterCredenciais()

  const [conexao] = await query(
    "SELECT access_token, refresh_token, expira_em FROM TAB_INTEGRACAO_BLING LIMIT 1"
  )
  if (!conexao) {
    throw new Error("Bling não conectado - vá em Configurações e conecte a conta do Bling primeiro")
  }

  const expiraEmBreve = new Date(conexao.expira_em).getTime() - Date.now() < 60_000
  if (!expiraEmBreve) {
    return conexao.access_token
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const resposta = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conexao.refresh_token,
    }),
  })

  if (!resposta.ok) {
    throw new Error("Falha ao renovar o token do Bling - reconecte a conta em Configuracoes")
  }

  const dados = await resposta.json()
  await salvarTokens(dados)
  return dados.access_token
}

export async function statusConexaoBling(): Promise<{
  conectado: boolean
  expiraEm: string | null
  ultimoErro: string | null
  ultimoErroEm: string | null
}> {
  const [conexao] = await query("SELECT expira_em, ultimo_erro, ultimo_erro_em FROM TAB_INTEGRACAO_BLING LIMIT 1")
  return {
    conectado: !!conexao,
    expiraEm: conexao?.expira_em ?? null,
    ultimoErro: conexao?.ultimo_erro ?? null,
    ultimoErroEm: conexao?.ultimo_erro_em ?? null,
  }
}

// Guarda a mensagem do ultimo erro de emissao/cancelamento, pra aparecer no
// painel de "pendencias fiscais" em Configuracoes - sem bloquear o fluxo
// principal se essa gravacao falhar (nunca deve derrubar a emissao em si).
async function registrarErroBling(mensagem: string): Promise<void> {
  await query(
    "UPDATE TAB_INTEGRACAO_BLING SET ultimo_erro = $1, ultimo_erro_em = NOW()",
    [mensagem]
  ).catch(() => {})
}

async function limparErroBling(): Promise<void> {
  await query("UPDATE TAB_INTEGRACAO_BLING SET ultimo_erro = NULL, ultimo_erro_em = NULL").catch(() => {})
}

async function chamarBling(caminho: string, opcoes: RequestInit = {}) {
  const token = await obterTokenValido()
  const resposta = await fetch(`${BLING_API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accept: "application/json",
      ...opcoes.headers,
    },
  })

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "")
    const mensagem = `Bling respondeu ${resposta.status}: ${corpo}`
    await registrarErroBling(mensagem)
    throw new Error(mensagem)
  }

  return resposta.json()
}

type ItemNota = {
  descricao: string
  quantidade: number
  valorUnitario: number
  ncm?: string | null
  gtin?: string | null
}

// Cria a NF-e no Bling, envia pra autorizacao na Sefaz e devolve os dados pra
// gravar no pedido. Erros aqui nunca devem apagar nada do pedido - so
// propagam a mensagem pro admin tentar de novo.
export async function emitirNotaFiscalBling(params: {
  clienteNome: string
  clienteDocumento: string | null
  clienteEmail: string | null
  endereco: {
    cep: string
    logradouro: string
    numero: string
    complemento: string | null
    bairro: string
    cidade: string
    estado: string
  } | null
  itens: ItemNota[]
  valorFrete: number
  numeroPedidoLoja: string
}): Promise<{ blingNotaId: string; linkDanfe: string | null; linkPdf: string | null }> {
  const corpoNota: Record<string, unknown> = {
    numeroPedidoLoja: params.numeroPedidoLoja,
    finalidade: 1, // 1 = Normal
    valorFrete: params.valorFrete,
    contato: {
      nome: params.clienteNome,
      ...(params.clienteDocumento ? { numeroDocumento: params.clienteDocumento } : {}),
      ...(params.clienteEmail ? { email: params.clienteEmail } : {}),
    },
    // classificacaoFiscal = NCM do item. Enviado direto aqui (sem precisar
    // que o produto exista cadastrado no Bling) - mantem o Bling restrito a
    // emissao de nota, sem sincronizar catalogo de produto.
    itens: params.itens.map((item, indice) => ({
      numeroItem: indice + 1,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      ...(item.ncm ? { classificacaoFiscal: item.ncm } : {}),
      ...(item.gtin ? { gtin: item.gtin } : {}),
    })),
  }

  if (params.endereco) {
    corpoNota.contato = {
      ...(corpoNota.contato as object),
      endereco: {
        endereco: params.endereco.logradouro,
        numero: params.endereco.numero,
        complemento: params.endereco.complemento || undefined,
        bairro: params.endereco.bairro,
        municipio: params.endereco.cidade,
        uf: params.endereco.estado,
        cep: params.endereco.cep.replace(/\D/g, ""),
      },
    }
  }

  const criada = await chamarBling("/notas-fiscais", {
    method: "POST",
    body: JSON.stringify(corpoNota),
  })
  const blingNotaId = String(criada.data?.id ?? criada.id)

  // Envia pra autorizacao na Sefaz - sem isso a nota fica so como rascunho.
  await chamarBling(`/nfe/${blingNotaId}/enviar`, { method: "POST" })

  // Reconsulta pra pegar os links do DANFE/PDF ja com a nota autorizada.
  const notaAtualizada = await chamarBling(`/notas-fiscais/${blingNotaId}`).catch(() => null)
  const dadosNota = notaAtualizada?.data ?? notaAtualizada

  await limparErroBling()

  return {
    blingNotaId,
    linkDanfe: dadosNota?.linkDanfe ?? null,
    linkPdf: dadosNota?.linkPDF ?? dadosNota?.linkPdf ?? null,
  }
}

// Reconsulta a situacao atual da nota de venda no Bling (mesmo codigo
// numerico usado em listarNotasEntradaBling) - usado pra atualizar a tela do
// pedido sem precisar abrir o Bling pra ver se uma nota travada (rejeitada,
// aguardando protocolo etc) ja mudou de status.
export async function consultarSituacaoNotaFiscalBling(blingNotaId: string): Promise<number> {
  const resposta = await chamarBling(`/notas-fiscais/${blingNotaId}`)
  const dadosNota = resposta?.data ?? resposta
  return Number(dadosNota?.situacao)
}

// Cancela uma NF-e ja autorizada na Sefaz. O Bling exige justificativa com
// pelo menos 15 caracteres (regra da propria Sefaz para cancelamento de NF-e).
export async function cancelarNotaFiscalBling(blingNotaId: string, justificativa: string): Promise<void> {
  if (justificativa.trim().length < 15) {
    throw new Error("Justificativa precisa ter pelo menos 15 caracteres (exigencia da Sefaz)")
  }

  await chamarBling(`/nfe/${blingNotaId}/cancelar`, {
    method: "POST",
    body: JSON.stringify({ justificativa: justificativa.trim() }),
  })

  await limparErroBling()
}

export type NotaEntradaBlingResumo = {
  id: string
  numero: string
  serie: string
  dataEmissao: string | null
  situacao: number
  valorTotal: number
  fornecedorNome: string | null
}

// Lista notas de ENTRADA (tipo=0) ja registradas no Bling - usado no painel
// "Notas do Bling" (Compras) como acompanhamento, cruzado com o que ja foi
// lancado localmente (TAB_COMPRA.bling_nota_id). So a listagem/status: o
// formato exato dos itens de cada nota (pro lancamento automatico) ainda nao
// foi confirmado contra uma conta real, entao o lancamento continua via
// importacao de XML (ver lib/nfe-xml.ts).
export async function listarNotasEntradaBling(params: {
  dataEmissaoInicial?: string
  dataEmissaoFinal?: string
}): Promise<NotaEntradaBlingResumo[]> {
  const query = new URLSearchParams({ tipo: "0" })
  if (params.dataEmissaoInicial) query.set("dataEmissaoInicial", `${params.dataEmissaoInicial} 00:00:00`)
  if (params.dataEmissaoFinal) query.set("dataEmissaoFinal", `${params.dataEmissaoFinal} 23:59:59`)

  const resposta = await chamarBling(`/notas-fiscais?${query.toString()}`)
  const lista = resposta?.data ?? []

  type NotaBlingBruta = {
    id: number | string
    numero?: number | string
    serie?: number | string
    dataEmissao?: string
    situacao: number | string
    valorTotal?: number | string
    contato?: { nome?: string }
    emitente?: { nome?: string }
  }

  return lista.map((nota: NotaBlingBruta) => ({
    id: String(nota.id),
    numero: String(nota.numero ?? ""),
    serie: String(nota.serie ?? ""),
    dataEmissao: nota.dataEmissao ?? null,
    situacao: Number(nota.situacao),
    valorTotal: Number(nota.valorTotal) || 0,
    fornecedorNome: nota.contato?.nome ?? nota.emitente?.nome ?? null,
  }))
}

export type PedidoVendaBlingResumo = {
  id: string
  numero: string
  dataVenda: string | null
  situacao: number
}

// Lista pedidos de venda de uma loja (canal) especifica do Bling - usado pra
// importar pedidos de Mercado Livre/Shopee (ver lib/bling-marketplace.ts). So
// o resumo (id/numero/data/situacao); o detalhe completo (itens, contato,
// endereco) e buscado por pedido em obterPedidoVendaBling.
//
// AVISO: nomes de campo abaixo ("idLoja", "dataInicial") ainda nao foram
// confirmados contra uma conta real do Bling com Mercado Livre/Shopee
// conectados - a doc publica nao detalha o schema completo desse endpoint.
// Confirmar e ajustar antes de rodar em producao (mesma ressalva ja existente
// pra listarNotasEntradaBling).
export async function listarPedidosVendaMarketplace(params: {
  idLoja: string
  dataInicial: string
}): Promise<PedidoVendaBlingResumo[]> {
  const query = new URLSearchParams({
    idLoja: params.idLoja,
    dataInicial: `${params.dataInicial} 00:00:00`,
  })

  const resposta = await chamarBling(`/pedidos/vendas?${query.toString()}`)
  const lista = resposta?.data ?? []

  type PedidoVendaBruto = {
    id: number | string
    numero?: number | string
    data?: string
    situacao?: { id?: number } | number
  }

  return lista.map((pedido: PedidoVendaBruto) => ({
    id: String(pedido.id),
    numero: String(pedido.numero ?? ""),
    dataVenda: pedido.data ?? null,
    situacao: Number(typeof pedido.situacao === "object" ? pedido.situacao?.id : pedido.situacao) || 0,
  }))
}

export type ItemPedidoVendaBling = {
  sku: string | null
  codigoBarras: string | null
  descricao: string
  quantidade: number
  valorUnitario: number
}

export type PedidoVendaBlingDetalhe = {
  id: string
  itens: ItemPedidoVendaBling[]
  contato: {
    nome: string
    documento: string | null
    email: string | null
    telefone: string | null
  }
  endereco: {
    cep: string
    logradouro: string
    numero: string
    complemento: string | null
    bairro: string
    cidade: string
    estado: string
  } | null
  blingNotaId: string | null
  linkDanfe: string | null
  linkPdf: string | null
}

// Detalhe completo de um pedido de venda - itens (com SKU/GTIN pra casar com
// TAB_PRODUTO), contato e endereco do comprador, e nota fiscal se o Bling ja
// tiver emitido (marketplace normalmente exige isso na hora da venda).
export async function obterPedidoVendaBling(id: string): Promise<PedidoVendaBlingDetalhe> {
  const resposta = await chamarBling(`/pedidos/vendas/${id}`)
  const dados = resposta?.data ?? resposta

  type ItemBruto = {
    codigo?: string
    descricao?: string
    quantidade?: number
    valor?: number
    produto?: { sku?: string; gtin?: string }
  }

  const contato = dados?.contato ?? {}
  const enderecoBruto = dados?.transporte?.etiqueta ?? dados?.contato?.endereco ?? null

  return {
    id: String(dados?.id ?? id),
    itens: (dados?.itens ?? []).map((item: ItemBruto) => ({
      sku: item.produto?.sku ?? item.codigo ?? null,
      codigoBarras: item.produto?.gtin ?? null,
      descricao: item.descricao ?? "",
      quantidade: Number(item.quantidade) || 0,
      valorUnitario: Number(item.valor) || 0,
    })),
    contato: {
      nome: contato.nome ?? "Cliente marketplace",
      documento: contato.numeroDocumento ?? null,
      email: contato.email ?? null,
      telefone: contato.telefone ?? contato.celular ?? null,
    },
    endereco: enderecoBruto
      ? {
          cep: String(enderecoBruto.cep ?? "").replace(/\D/g, ""),
          logradouro: enderecoBruto.endereco ?? "",
          numero: enderecoBruto.numero ?? "",
          complemento: enderecoBruto.complemento ?? null,
          bairro: enderecoBruto.bairro ?? "",
          cidade: enderecoBruto.municipio ?? "",
          estado: enderecoBruto.uf ?? "",
        }
      : null,
    blingNotaId: dados?.notaFiscal?.id ? String(dados.notaFiscal.id) : null,
    linkDanfe: dados?.notaFiscal?.linkDanfe ?? null,
    linkPdf: dados?.notaFiscal?.linkPDF ?? dados?.notaFiscal?.linkPdf ?? null,
  }
}

// Baixa o XML autorizado de uma nota fiscal (saida) ja emitida pelo Bling.
//
// O campo "xml" do GET /notas-fiscais/{id} vem de dois jeitos dependendo da
// conta/versao: ora o proprio conteudo do XML, ora uma URL pro arquivo. Trata
// os dois - sair quebrando por causa disso deixaria o cliente sem o documento
// que ele e obrigado a guardar por 5 anos.
//
// Devolve null (em vez de erro) quando a nota ainda nao tem XML: nota so
// autorizada na Sefaz tem XML, e uma nota em rascunho/rejeitada nao e um caso
// de erro, e so um documento que ainda nao existe.
export async function obterXmlNotaFiscalBling(blingNotaId: string): Promise<string | null> {
  const resposta = await chamarBling(`/notas-fiscais/${blingNotaId}`)
  const dadosNota = resposta?.data ?? resposta
  const xml: string | null = dadosNota?.xml ?? null

  if (!xml || !xml.trim()) return null

  if (/^https?:\/\//i.test(xml.trim())) {
    const arquivo = await fetch(xml.trim())
    if (!arquivo.ok) {
      throw new Error(`Nao foi possivel baixar o XML da nota no Bling (HTTP ${arquivo.status})`)
    }
    return await arquivo.text()
  }

  return xml
}
