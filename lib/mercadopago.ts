import { MercadoPagoConfig, Preference, Payment } from "mercadopago"
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

export async function getMercadoPagoConfig(): Promise<MercadoPagoConfig> {
  return criarClienteMP()
}

// Traduz o metodo de pagamento que o Mercado Pago devolve no pagamento
// aprovado pra um rotulo legivel, salvo em TAB_PEDIDO.forma_pagamento -
// antes esse campo so era usado pela Venda Balcao, nunca preenchido pra
// pedido feito pelo site.
const ROTULOS_METODO_PAGAMENTO_MP: Record<string, string> = {
  pix: "Pix",
  bolbradesco: "Boleto",
  pec: "Boleto",
  master: "Cartao de credito",
  visa: "Cartao de credito",
  elo: "Cartao de credito",
  amex: "Cartao de credito",
  hipercard: "Cartao de credito",
  debmaster: "Cartao de debito",
  debvisa: "Cartao de debito",
  debelo: "Cartao de debito",
}

const ROTULOS_TIPO_PAGAMENTO_MP: Record<string, string> = {
  bank_transfer: "Pix",
  ticket: "Boleto",
  credit_card: "Cartao de credito",
  debit_card: "Cartao de debito",
}

export function rotuloFormaPagamentoMP(paymentTypeId?: string | null, paymentMethodId?: string | null): string {
  if (paymentMethodId && ROTULOS_METODO_PAGAMENTO_MP[paymentMethodId]) {
    return ROTULOS_METODO_PAGAMENTO_MP[paymentMethodId]
  }
  if (paymentTypeId && ROTULOS_TIPO_PAGAMENTO_MP[paymentTypeId]) {
    return ROTULOS_TIPO_PAGAMENTO_MP[paymentTypeId]
  }
  return "Mercado Pago"
}
