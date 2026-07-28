import { getSegredo, segredoConfigurado } from "@/lib/segredos"

// Cliente da API do Frenet (agrega Correios e outras transportadoras) para
// cotacao de frete real por CEP, com varias opcoes (transportadora/servico)
// pro cliente escolher no checkout - nao emite etiqueta, so cotacao.
//
// IMPORTANTE: o formato do payload/resposta abaixo segue a documentacao
// publica conhecida da API do Frenet (POST /shipping/quote, header "token"),
// mas nao foi validado contra uma conta real (a doc oficial e renderizada em
// JS e nao pode ser lida automaticamente). Se o formato do payload estiver
// errado, a chamada simplesmente falha e cai no fallback da tabela de faixas
// (nunca trava o checkout) - mas isso PRECISA ser testado contra uma conta
// Frenet real antes de operar com pedido de verdade.
//
// O token e configuravel em Configuracoes > Integracoes (TAB_INTEGRACAO_SEGREDO,
// chave "frenet_token") - cai pra variavel de ambiente FRENET_TOKEN se nao
// houver nada configurado no banco. Sem nenhum dos dois, calcularOpcoesFrete()
// (lib/configuracoes.ts) cai direto na tabela de faixas por regiao.
const FRENET_API_URL = process.env.FRENET_API_URL || "https://api.frenet.com.br"

export async function frenetConfigurado(): Promise<boolean> {
  return segredoConfigurado("frenet_token")
}

type ItemCotacao = {
  quantidade: number
  pesoKg: number
  alturaCm: number
  larguraCm: number
  comprimentoCm: number
}

export type OpcaoFreteFrenet = {
  transportadora: string
  servico: string
  valor: number
  prazoDias: number
}

type ServicoFrenet = {
  Carrier: string
  ServiceDescription: string
  ShippingPrice: string
  DeliveryTime: number
  Error: boolean
  Msg?: string
}

// Cota o frete pelo CEP de origem (loja) e destino (cliente), devolvendo
// todas as opcoes validas (ordenadas da mais barata pra mais cara) - quem
// chama decide qual mostrar/usar, nao escolhe sozinho aqui.
export async function cotarFreteFrenet(params: {
  cepOrigem: string
  cepDestino: string
  valorDeclaradoTotal: number
  itens: ItemCotacao[]
}): Promise<OpcaoFreteFrenet[]> {
  const token = await getSegredo("frenet_token")
  if (!token) {
    throw new Error("Token da Frenet nao configurado")
  }

  const resposta = await fetch(`${FRENET_API_URL}/shipping/quote`, {
    method: "POST",
    headers: {
      token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      SellerCEP: params.cepOrigem.replace(/\D/g, ""),
      RecipientCEP: params.cepDestino.replace(/\D/g, ""),
      ShipmentInvoiceValue: params.valorDeclaradoTotal,
      RecipientCountry: "BR",
      ShippingItemArray: params.itens.map((item) => ({
        Height: item.alturaCm,
        Length: item.comprimentoCm,
        Width: item.larguraCm,
        Weight: item.pesoKg,
        Quantity: item.quantidade,
      })),
    }),
  })

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "")
    throw new Error(`Frenet respondeu ${resposta.status}: ${corpo}`)
  }

  const dados = await resposta.json()
  const servicos: ServicoFrenet[] = dados?.ShippingSevicesArray ?? []

  return servicos
    .filter((s) => !s.Error && s.ShippingPrice)
    .map((s) => ({
      transportadora: s.Carrier,
      servico: s.ServiceDescription,
      valor: Number(String(s.ShippingPrice).replace(",", ".")),
      prazoDias: Number(s.DeliveryTime),
    }))
    .sort((a, b) => a.valor - b.valor)
}

export type EventoRastreio = { data: string | null; status: string; local: string | null }

// Rastreamento real (confirma que o codigo existe e mostra o status atual) -
// EXIGE o codigo de servico da transportadora (ShippingServiceCode), visivel
// no painel da conta Frenet - nao tem como inferir esse codigo aqui, entao
// so funciona quando o admin informa (nunca "chuta" um valor).
export async function rastrearPedidoFrenet(params: {
  trackingNumber: string
  shippingServiceCode: string
}): Promise<{ status: string; eventos: EventoRastreio[] }> {
  const token = await getSegredo("frenet_token")
  if (!token) {
    throw new Error("Token da Frenet nao configurado")
  }

  const resposta = await fetch(`${FRENET_API_URL}/tracking/trackinginfo`, {
    method: "POST",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify({
      TrackingNumber: params.trackingNumber,
      ShippingServiceCode: params.shippingServiceCode,
    }),
  })

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "")
    throw new Error(`Frenet respondeu ${resposta.status}: ${corpo}`)
  }

  const dados = await resposta.json()
  const eventos: EventoRastreio[] = (dados?.TrackingEvents ?? []).map((e: any) => ({
    data: e.Date ?? null,
    status: e.Status ?? e.Description ?? "Evento sem descricao",
    local: e.Location ?? null,
  }))

  return {
    status: dados?.Status ?? (eventos[0]?.status || "Sem informacao"),
    eventos,
  }
}
