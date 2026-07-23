import { query } from "@/lib/db"

// Integracao com o Bling - SOMENTE emissao de NF-e a partir de um pedido ja
// pago. Nao sincroniza estoque nem financeiro com o Bling (esse controle
// continua so neste sistema) - escopo combinado explicitamente com o cliente.
//
// Autenticacao OAuth2 (fluxo "authorization code"): o dono da loja conecta a
// conta do Bling uma vez (fluxo iniciado em /api/admin/bling/conectar), e a
// partir dai os tokens ficam guardados em TAB_INTEGRACAO_BLING - nunca no
// client, nunca em log, nunca junto de TAB_CONFIGURACAO (que e devolvida
// inteira pela tela de Configuracoes).

const BLING_API_URL = "https://api.bling.com.br/Api/v3"
const BLING_AUTH_URL = "https://www.bling.com.br/Api/v3/oauth/authorize"
const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token"

const CLIENT_ID = process.env.BLING_CLIENT_ID
const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET

function exigirCredenciais() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("BLING_CLIENT_ID/BLING_CLIENT_SECRET nao configurados")
  }
}

export function montarUrlAutorizacaoBling(redirectUri: string, state: string): string {
  exigirCredenciais()
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID!,
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
  exigirCredenciais()

  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
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
  exigirCredenciais()

  const [conexao] = await query(
    "SELECT access_token, refresh_token, expira_em FROM TAB_INTEGRACAO_BLING LIMIT 1"
  )
  if (!conexao) {
    throw new Error("Bling nao conectado - va em Configuracoes e conecte a conta do Bling primeiro")
  }

  const expiraEmBreve = new Date(conexao.expira_em).getTime() - Date.now() < 60_000
  if (!expiraEmBreve) {
    return conexao.access_token
  }

  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
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

export async function statusConexaoBling(): Promise<{ conectado: boolean; expiraEm: string | null }> {
  const [conexao] = await query("SELECT expira_em FROM TAB_INTEGRACAO_BLING LIMIT 1")
  return { conectado: !!conexao, expiraEm: conexao?.expira_em ?? null }
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
    throw new Error(`Bling respondeu ${resposta.status}: ${corpo}`)
  }

  return resposta.json()
}

type ItemNota = { descricao: string; quantidade: number; valorUnitario: number }

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
    itens: params.itens.map((item, indice) => ({
      numeroItem: indice + 1,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
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

  return {
    blingNotaId,
    linkDanfe: dadosNota?.linkDanfe ?? null,
    linkPdf: dadosNota?.linkPDF ?? dadosNota?.linkPdf ?? null,
  }
}
