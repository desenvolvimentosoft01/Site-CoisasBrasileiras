import { MercadoPagoConfig, Preference, Payment } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export const preferenceMP = new Preference(client)
export const paymentMP = new Payment(client)

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
