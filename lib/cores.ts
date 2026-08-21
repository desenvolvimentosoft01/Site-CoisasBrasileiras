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

// ============================================================
// CORES DO SISTEMA (painel admin)
// Separadas das cores do site de proposito: o site e a vitrine do cliente
// final e muda por marca; o painel e ferramenta de trabalho e e o mesmo pras
// duas lojas. Misturar os dois obrigava a escolher entre um admin com a cara
// da loja colorida ou da loja branca - e a trocar de cor ao trocar de marca.
//
// Aqui estao as cores que antes viviam fixas nas classes do Tailwind (o menu
// escuro, o cabecalho da grade, a barra de ferramentas). Virando variavel, o
// desenvolvedor consegue mudar sem tocar em 20 arquivos.
// ============================================================
export const CORES_SISTEMA = [
  { chave: "cor_sistema_primaria", variavel: "--admin-primaria", label: "Primária (botões, item ativo do menu)", padrao: "#4f46e5" },
  { chave: "cor_sistema_menu_fundo", variavel: "--admin-menu-fundo", label: "Fundo do menu lateral", padrao: "#0f172a" },
  { chave: "cor_sistema_menu_texto", variavel: "--admin-menu-texto", label: "Texto do menu lateral", padrao: "#94a3b8" },
  { chave: "cor_sistema_menu_hover", variavel: "--admin-menu-hover", label: "Item do menu sob o mouse", padrao: "#1e293b" },
  { chave: "cor_sistema_abas_fundo", variavel: "--admin-abas-fundo", label: "Fundo da barra de abas", padrao: "#1e293b" },
  { chave: "cor_sistema_grade_cabecalho", variavel: "--admin-grade-cabecalho", label: "Cabeçalho da grade", padrao: "#1e293b" },
  { chave: "cor_sistema_grade_cabecalho_texto", variavel: "--admin-grade-cabecalho-texto", label: "Texto do cabeçalho da grade", padrao: "#e2e8f0" },
  { chave: "cor_sistema_grade_selecao", variavel: "--admin-grade-selecao", label: "Linha selecionada na grade", padrao: "#fffbeb" },
  { chave: "cor_sistema_barra_fundo", variavel: "--admin-barra-fundo", label: "Fundo da barra de ferramentas", padrao: "#ffffff" },
  { chave: "cor_sistema_fundo", variavel: "--admin-fundo", label: "Fundo das telas", padrao: "#f1f5f9" },
] as const

export type ChaveCorSistema = (typeof CORES_SISTEMA)[number]["chave"]

export const CHAVES_COR_SISTEMA: string[] = CORES_SISTEMA.map((c) => c.chave)

// Diferente do site, aqui o padrao entra sempre: as classes do admin usam a
// variavel direto, entao uma variavel vazia deixaria o menu sem cor nenhuma.
export function styleCoresSistema(config: Record<string, string>): CSSProperties {
  const style: Record<string, string> = {}
  for (const { chave, variavel, padrao } of CORES_SISTEMA) {
    style[variavel] = config[chave] || padrao
  }
  return style as CSSProperties
}
