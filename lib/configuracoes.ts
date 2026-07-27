import { query } from "@/lib/db"
import { cotarFreteFrenet, frenetConfigurado } from "@/lib/frenet"

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

type ItemFreteDetalhado = {
  quantidade: number
  pesoKg: number
  alturaCm: number
  larguraCm: number
  comprimentoCm: number
  valorUnitario: number
}

// Dimensoes minimas aceitas pelas transportadoras - usadas quando o produto
// nao tem dimensoes cadastradas, pra nao quebrar a cotacao.
const DIMENSAO_MINIMA_CM = 11

export type OpcaoFrete = {
  transportadora: string
  servico: string
  valor: number
  prazoDias: number | null
}

// Calcula as opcoes de frete disponiveis (uma ou mais). Se o Frenet estiver
// configurado (FRENET_TOKEN) e tivermos CEP de destino + dimensoes dos itens,
// cota o valor real por API, com todas as transportadoras/servicos
// retornados por eles. Caso contrario (ou se a API falhar), cai numa unica
// opcao vinda da tabela de faixas por regiao/peso (TAB_FRETE_FAIXA),
// cadastrada e ajustada pelo admin em Configuracoes > Frete - nunca trava o
// checkout por falta de configuracao ou instabilidade externa.
export async function calcularOpcoesFrete(params: {
  subtotal: number
  pesoKg: number
  estado: string
  cepDestino?: string
  itensDetalhados?: ItemFreteDetalhado[]
}): Promise<OpcaoFrete[]> {
  const config = await getConfiguracoes([
    "frete_valor_base",
    "frete_gratis_acima_de",
    "cep_origem",
  ])
  const valorBaseFallback = Number(config.frete_valor_base) || 0
  const freteGratisAcimaDe = Number(config.frete_gratis_acima_de) || 0

  if (freteGratisAcimaDe > 0 && params.subtotal >= freteGratisAcimaDe) {
    return [{ transportadora: "Frete gratis", servico: "Padrao", valor: 0, prazoDias: null }]
  }

  if (
    frenetConfigurado() &&
    config.cep_origem &&
    params.cepDestino &&
    params.itensDetalhados &&
    params.itensDetalhados.length > 0
  ) {
    try {
      const opcoes = await cotarFreteFrenet({
        cepOrigem: config.cep_origem,
        cepDestino: params.cepDestino,
        valorDeclaradoTotal: params.subtotal,
        itens: params.itensDetalhados.map((item) => ({
          quantidade: item.quantidade,
          pesoKg: Math.max(item.pesoKg, 0.1),
          alturaCm: Math.max(item.alturaCm, DIMENSAO_MINIMA_CM),
          larguraCm: Math.max(item.larguraCm, DIMENSAO_MINIMA_CM),
          comprimentoCm: Math.max(item.comprimentoCm, DIMENSAO_MINIMA_CM),
        })),
      })
      if (opcoes.length > 0) return opcoes
    } catch (erro) {
      // Falha na API externa (fora do ar, CEP invalido, etc.) nunca deve
      // travar o checkout - so registra e cai no fallback abaixo.
      console.error("Falha ao cotar frete no Frenet, usando fallback:", erro)
    }
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
      return [
        {
          transportadora: "Transportadora padrao",
          servico: "Padrao",
          valor: Number(faixa.valor),
          prazoDias: faixa.prazo_dias,
        },
      ]
    }
  }

  // Sem faixa cadastrada pra essa regiao/peso (ou estado invalido/nao
  // informado) - cai pro valor fixo configurado, pra nunca travar o checkout.
  return [
    { transportadora: "Transportadora padrao", servico: "Padrao", valor: valorBaseFallback, prazoDias: null },
  ]
}
