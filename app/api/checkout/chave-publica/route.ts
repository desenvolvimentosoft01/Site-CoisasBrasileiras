import { getSegredo } from "@/lib/segredos"
import { NextResponse } from "next/server"

// Endpoint publico (sem auth) - a public key do Mercado Pago nao e um
// segredo, e feita pra ser usada no navegador do cliente pra inicializar o
// Payment Brick no checkout. Diferente do access token, nunca fica escondida.
export async function GET() {
  const publicKey = await getSegredo("mercadopago_public_key")
  return NextResponse.json({ publicKey: publicKey || null })
}
