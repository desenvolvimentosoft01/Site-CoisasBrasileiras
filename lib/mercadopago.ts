import { MercadoPagoConfig, Preference, Payment } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export const preferenceMP = new Preference(client)
export const paymentMP = new Payment(client)
