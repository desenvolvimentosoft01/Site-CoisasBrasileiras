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

export async function calcularFrete(subtotal: number): Promise<number> {
  const config = await getConfiguracoes(["frete_valor_base", "frete_gratis_acima_de"])
  const valorBase = Number(config.frete_valor_base) || 0
  const freteGratisAcimaDe = Number(config.frete_gratis_acima_de) || 0

  if (freteGratisAcimaDe > 0 && subtotal >= freteGratisAcimaDe) {
    return 0
  }

  return valorBase
}
