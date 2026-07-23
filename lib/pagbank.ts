// Cliente da API do PagBank (checkout hospedado - POST /checkouts) usado como
// segunda opcao de pagamento alem do Mercado Pago. Igual ao Mercado Pago, o
// cartao do cliente nunca passa pelo nosso servidor: o PagBank hospeda a
// pagina de pagamento e so nos avisa o resultado via webhook.
//
// PAGBANK_API_URL aponta pro sandbox por padrao - trocar pra
// https://api.pagseguro.com em producao via variavel de ambiente.
const PAGBANK_API_URL = process.env.PAGBANK_API_URL || "https://sandbox.api.pagseguro.com"
const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN

type ItemCheckout = {
  referenceId: string
  nome: string
  quantidade: number
  valorUnitario: number // em reais - convertido pra centavos aqui dentro
}

async function chamarPagBank(caminho: string, opcoes: RequestInit = {}) {
  if (!PAGBANK_TOKEN) {
    throw new Error("PAGBANK_TOKEN nao configurado")
  }

  const resposta = await fetch(`${PAGBANK_API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${PAGBANK_TOKEN}`,
      "Content-Type": "application/json",
      accept: "application/json",
      ...opcoes.headers,
    },
  })

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "")
    throw new Error(`PagBank respondeu ${resposta.status}: ${corpo}`)
  }

  return resposta.json()
}

// Cria o checkout hospedado e devolve o link (redirect_url) pra onde o
// cliente deve ser mandado pra pagar.
export async function criarCheckoutPagBank(params: {
  referenceId: string
  itens: ItemCheckout[]
  valorFrete: number
  returnUrl: string
  notificationUrl: string
}) {
  const itensPagBank = params.itens.map((item) => ({
    reference_id: item.referenceId,
    name: item.nome,
    quantity: item.quantidade,
    unit_amount: Math.round(item.valorUnitario * 100),
  }))

  const corpo: Record<string, unknown> = {
    reference_id: params.referenceId,
    items: itensPagBank,
    return_url: params.returnUrl,
    notification_urls: [params.notificationUrl],
  }

  if (params.valorFrete > 0) {
    corpo.shipping = {
      type: "CUSTOM",
      amount: Math.round(params.valorFrete * 100),
    }
  }

  return chamarPagBank("/checkouts", { method: "POST", body: JSON.stringify(corpo) })
}

// Reconsulta o checkout direto na API do PagBank usando nosso token - nunca
// confiamos no conteudo do webhook por si so (mesmo principio do webhook do
// Mercado Pago: o corpo da notificacao so serve pra saber "o que foi alterado",
// quem confirma o status de verdade e a API, autenticada com nosso token).
export async function consultarCheckoutPagBank(checkoutId: string) {
  return chamarPagBank(`/checkouts/${checkoutId}`)
}
