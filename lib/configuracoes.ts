import { query } from "@/lib/db"

// Le configuracoes da loja (TAB_CONFIGURACAO, chave/valor) de uma vez so.
// Usado tanto no calculo de frete quanto nas telas publicas (contato, etc.).
export async function getConfiguracoes(chaves: string[]): Promise<Record<string, string>> {
  const linhas = await query(
    "SELECT chave, valor FROM TAB_CONFIGURACAO WHERE chave = ANY($1)",
    [chaves]
  )
  const mapa: Record<string, string> = {}
  for (const linha of linhas) {
    mapa[linha.chave] = linha.valor ?? ""
  }
  return mapa
}

// Agrupamento oficial de UF por regiao do IBGE - usado para achar a faixa de
// frete certa em TAB_FRETE_FAIXA a partir do estado de entrega.
const REGIAO_POR_UF: Record<string, string> = {
  AC: "norte", AP: "norte", AM: "norte", PA: "norte", RO: "norte", RR: "norte", TO: "norte",
  AL: "nordeste", BA: "nordeste", CE: "nordeste", MA: "nordeste", PB: "nordeste",
  PE: "nordeste", PI: "nordeste", RN: "nordeste", SE: "nordeste",
  DF: "centro_oeste", GO: "centro_oeste", MT: "centro_oeste", MS: "centro_oeste",
  ES: "sudeste", MG: "sudeste", RJ: "sudeste", SP: "sudeste",
  PR: "sul", RS: "sul", SC: "sul",
}

// Peso minimo assumido quando o produto nao tem peso_kg cadastrado - evita
// cotar frete de graca por falta de cadastro completo.
const PESO_PADRAO_KG = 0.3

// Calcula o frete a partir de uma tabela de faixas por regiao/peso
// (TAB_FRETE_FAIXA), cadastrada e ajustada pelo admin em Configuracoes > Frete.
// Fica pronta pra ser trocada pela cotacao real da API dos Correios assim que
// a loja tiver contrato (cartao de postagem) - so troca o miolo desta funcao,
// a assinatura e os chamadores (checkout, /api/frete) continuam os mesmos.
export async function calcularFrete(params: {
  subtotal: number
  pesoKg: number
  estado: string
}): Promise<{ valor: number; prazoDias: number | null }> {
  const config = await getConfiguracoes(["frete_valor_base", "frete_gratis_acima_de"])
  const valorBaseFallback = Number(config.frete_valor_base) || 0
  const freteGratisAcimaDe = Number(config.frete_gratis_acima_de) || 0

  if (freteGratisAcimaDe > 0 && params.subtotal >= freteGratisAcimaDe) {
    return { valor: 0, prazoDias: null }
  }

  const pesoConsiderado = Math.max(params.pesoKg, PESO_PADRAO_KG)
  const regiao = REGIAO_POR_UF[params.estado?.toUpperCase()] || null

  if (regiao) {
    const [faixa] = await query(
      `SELECT valor, prazo_dias FROM TAB_FRETE_FAIXA
       WHERE regiao = $1 AND $2 >= peso_min_kg AND $2 <= peso_max_kg
       ORDER BY peso_min_kg LIMIT 1`,
      [regiao, pesoConsiderado]
    )
    if (faixa) {
      return { valor: Number(faixa.valor), prazoDias: faixa.prazo_dias }
    }
  }

  // Sem faixa cadastrada pra essa regiao/peso (ou estado invalido/nao
  // informado) - cai pro valor fixo configurado, pra nunca travar o checkout.
  return { valor: valorBaseFallback, prazoDias: null }
}
