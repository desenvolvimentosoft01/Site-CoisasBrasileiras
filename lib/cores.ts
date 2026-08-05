import type { CSSProperties } from "react"

// Paleta completa do tema (site + admin), editavel so pelo desenvolvedor em
// /admin/cores. Cada chave vira uma variavel CSS (--primary, --background
// etc.) sobrescrita via inline style no wrapper raiz - mesmo mecanismo que
// ja existia so pra "cor_primaria" em Configuracoes > Aparencia.
export const CORES_TEMA = [
  { chave: "cor_primaria", variavel: "--primary", label: "Primária (botões, links)" },
  { chave: "cor_primaria_texto", variavel: "--primary-foreground", label: "Texto sobre a cor primária" },
  { chave: "cor_secundaria", variavel: "--secondary", label: "Secundária" },
  { chave: "cor_secundaria_texto", variavel: "--secondary-foreground", label: "Texto sobre a secundária" },
  { chave: "cor_destaque", variavel: "--accent", label: "Destaque (hover, seleção)" },
  { chave: "cor_destaque_texto", variavel: "--accent-foreground", label: "Texto sobre o destaque" },
  { chave: "cor_neutra", variavel: "--muted", label: "Neutra (fundos suaves)" },
  { chave: "cor_neutra_texto", variavel: "--muted-foreground", label: "Texto neutro (legendas)" },
  { chave: "cor_perigo", variavel: "--destructive", label: "Perigo (excluir, erro)" },
  { chave: "cor_fundo", variavel: "--background", label: "Fundo da página" },
  { chave: "cor_texto", variavel: "--foreground", label: "Texto principal" },
  { chave: "cor_borda", variavel: "--border", label: "Bordas" },
] as const

export type ChaveCorTema = (typeof CORES_TEMA)[number]["chave"]

export const CHAVES_COR_TEMA: string[] = CORES_TEMA.map((c) => c.chave)

// Monta o objeto de style com as variaveis CSS a partir das configuracoes
// salvas (chave -> valor) - so entra no style o que estiver preenchido, o
// resto continua usando o padrao definido em app/globals.css.
export function styleCoresTema(config: Record<string, string>): CSSProperties {
  const style: Record<string, string> = {}
  for (const { chave, variavel } of CORES_TEMA) {
    if (config[chave]) style[variavel] = config[chave]
  }
  return style as CSSProperties
}
