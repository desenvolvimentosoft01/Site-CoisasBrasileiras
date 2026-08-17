import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from "mercadopago"
import { getSegredo } from "@/lib/segredos"

// Token configuravel em Configuracoes > Integracoes (TAB_INTEGRACAO_SEGREDO,
// chave "mercadopago_access_token") - cai pra variavel de ambiente
// MERCADOPAGO_ACCESS_TOKEN se nao houver nada configurado no banco. Como o
// SDK do Mercado Pago precisa do token na hora de criar o client, essas
// funcoes criam um client novo a cada chamada (nunca cacheiam o client em si,
// so o valor do token via lib/segredos.ts) - dessa forma uma troca de token
// pelo admin reflete rapido, sem precisar reiniciar o processo.
async function criarClienteMP(): Promise<MercadoPagoConfig> {
  const accessToken = await getSegredo("mercadopago_access_token")
  if (!accessToken) {
    throw new Error("Token de acesso do Mercado Pago nao configurado")
  }
  return new MercadoPagoConfig({ accessToken })
}

export async function getPreferenceMP(): Promise<Preference> {
  return new Preference(await criarClienteMP())
}

export async function getPaymentMP(): Promise<Payment> {
  return new Payment(await criarClienteMP())
}

export async function getPaymentRefundMP(): Promise<PaymentRefund> {
  return new PaymentRefund(await criarClienteMP())
}

export async function getMercadoPagoConfig(): Promise<MercadoPagoConfig> {
  return criarClienteMP()
}

// Traduz o metodo de pagamento que o Mercado Pago devolve no pagamento
// aprovado pro mesmo codigo usado pela Venda Balcao (forma_pagamento),
// salvo cru em TAB_PEDIDO - a traducao pro rotulo exibido ao usuario
// acontece so na hora de renderizar, via lib/formas-pagamento.ts.
const CODIGO_METODO_PAGAMENTO_MP: Record<string, string> = {
  pix: "pix",
  bolbradesco: "boleto",
  pec: "boleto",
  master: "cartao_credito",
  visa: "cartao_credito",
  elo: "cartao_credito",
  amex: "cartao_credito",
  hipercard: "cartao_credito",
  debmaster: "cartao_debito",
  debvisa: "cartao_debito",
  debelo: "cartao_debito",
}

const CODIGO_TIPO_PAGAMENTO_MP: Record<string, string> = {
  bank_transfer: "pix",
  ticket: "boleto",
  credit_card: "cartao_credito",
  debit_card: "cartao_debito",
}

// O SDK do Mercado Pago faz "throw await response.json()" em erros da API
// (nao lanca um Error de verdade), entao "erro instanceof Error" nunca bate
// e o motivo real fica escondido. Essa funcao extrai a mensagem do corpo cru
// que o MP devolve pra poder mostrar algo util em vez de um erro generico.
export function mensagemErroMercadoPago(erro: unknown, mensagemPadrao: string): string {
  if (erro instanceof Error) return erro.message
  if (erro && typeof erro === "object") {
    const corpo = erro as { message?: string; cause?: Array<{ description?: string }> }
    if (corpo.cause?.[0]?.description) return corpo.cause[0].description
    if (corpo.message) return corpo.message
  }
  return mensagemPadrao
}

export function codigoFormaPagamentoMP(paymentTypeId?: string | null, paymentMethodId?: string | null): string {
  if (paymentMethodId && CODIGO_METODO_PAGAMENTO_MP[paymentMethodId]) {
    return CODIGO_METODO_PAGAMENTO_MP[paymentMethodId]
  }
  if (paymentTypeId && CODIGO_TIPO_PAGAMENTO_MP[paymentTypeId]) {
    return CODIGO_TIPO_PAGAMENTO_MP[paymentTypeId]
  }
  return "mercadopago"
}
