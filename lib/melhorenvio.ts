// Cliente da API do Melhor Envio (agrega Correios e outras transportadoras)
// para cotacao de frete real por CEP. So calcula cotacao aqui - nao emite
// etiqueta nem contrata envio, isso fica pra uma etapa futura se a loja
// quiser automatizar a postagem tambem.
//
// MELHOR_ENVIO_TOKEN e um token de acesso pessoal, gerado direto no painel
// da conta (nao e o fluxo OAuth completo - esse token so serve pra chamadas
// feitas pela propria loja, dona da conta). Sem ele configurado, a funcao
// que usa este cliente (calcularFrete em lib/configuracoes.ts) cai
// automaticamente na tabela de faixas por regiao - nunca trava o checkout.
const MELHOR_ENVIO_API_URL =
  process.env.MELHOR_ENVIO_API_URL || "https://sandbox.melhorenvio.com.br"
const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN

export function melhorEnvioConfigurado() {
  return Boolean(MELHOR_ENVIO_TOKEN)
}

type ItemCotacao = {
  quantidade: number
  pesoKg: number
  alturaCm: number
  larguraCm: number
  comprimentoCm: number
  valorDeclarado: number
}

type CotacaoMelhorEnvio = {
  id: number
  name: string // nome da transportadora/servico, ex: "PAC", "SEDEX"
  price: string
  delivery_time: number
  error?: string
}

// Cotacao de frete pelo CEP de origem (loja) e destino (cliente). Retorna a
// opcao mais barata entre as que a API conseguiu cotar (ignora as que
// vieram com erro, ex: transportadora sem cobertura pro destino).
export async function cotarFreteMelhorEnvio(params: {
  cepOrigem: string
  cepDestino: string
  itens: ItemCotacao[]
}): Promise<{ valor: number; prazoDias: number; servico: string } | null> {
  if (!MELHOR_ENVIO_TOKEN) {
    throw new Error("MELHOR_ENVIO_TOKEN nao configurado")
  }

  const resposta = await fetch(`${MELHOR_ENVIO_API_URL}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Coisas Brasileiras (contato via painel admin)",
    },
    body: JSON.stringify({
      from: { postal_code: params.cepOrigem.replace(/\D/g, "") },
      to: { postal_code: params.cepDestino.replace(/\D/g, "") },
      products: params.itens.map((item, i) => ({
        id: String(i),
        width: item.larguraCm,
        height: item.alturaCm,
        length: item.comprimentoCm,
        weight: item.pesoKg,
        insurance_value: item.valorDeclarado,
        quantity: item.quantidade,
      })),
    }),
  })

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "")
    throw new Error(`Melhor Envio respondeu ${resposta.status}: ${corpo}`)
  }

  const cotacoes: CotacaoMelhorEnvio[] = await resposta.json()
  const validas = cotacoes.filter((c) => !c.error && c.price)

  if (validas.length === 0) return null

  const maisBarata = validas.reduce((menor, atual) =>
    Number(atual.price) < Number(menor.price) ? atual : menor
  )

  return {
    valor: Number(maisBarata.price),
    prazoDias: maisBarata.delivery_time,
    servico: maisBarata.name,
  }
}
