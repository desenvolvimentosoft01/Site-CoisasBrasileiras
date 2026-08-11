import { getSegredo } from "@/lib/segredos"
import { getConfiguracoes } from "@/lib/configuracoes"
import { NextResponse } from "next/server"

// Endpoint publico (sem auth) - a public key do Mercado Pago nao e um
// segredo, e feita pra ser usada no navegador do cliente pra inicializar o
// Payment Brick no checkout. Diferente do access token, nunca fica escondida.
// Tambem devolve regras do checkout (Configuracoes > Regras) que o
// formulario precisa saber antes de renderizar, tipo se CPF e obrigatorio.
export async function GET() {
  const [publicKey, config] = await Promise.all([
    getSegredo("mercadopago_public_key"),
    getConfiguracoes(["cpf_obrigatorio_checkout"]),
  ])
  return NextResponse.json({
    publicKey: publicKey || null,
    cpfObrigatorio: config.cpf_obrigatorio_checkout === "true",
  })
}
