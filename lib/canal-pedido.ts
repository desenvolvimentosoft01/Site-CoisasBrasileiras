import type { ChaveRecurso, Recursos } from "@/lib/recursos"

// Canal de venda - complementa TAB_PEDIDO.origem (site/balcao, macro) com um
// detalhe mais fino de onde a venda de fato aconteceu. Fixo (nao ha tela de
// cadastro de canais), mesmo padrao do in-mente-gestao.
export type CanalPedido = "site" | "whatsapp" | "instagram" | "balcao" | "mercadolivre" | "shopee"

export const CANAL_LABEL: Record<CanalPedido, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  balcao: "Balcao",
  mercadolivre: "Mercado Livre",
  shopee: "Shopee",
}

export const CANAIS_VENDA_BALCAO: { valor: CanalPedido; rotulo: string }[] = [
  { valor: "balcao", rotulo: "Balcao (presencial)" },
  { valor: "whatsapp", rotulo: "WhatsApp" },
  { valor: "instagram", rotulo: "Instagram" },
]

// Canal que so existe se a integracao correspondente estiver liberada no
// plano. Canal sem entrada aqui (site, WhatsApp, Instagram, balcao) e da
// propria loja e aparece sempre.
//
// Fica nesta lib, e nao em cada tela, pra que filtro de canal, seletor de
// venda e relatorio nunca discordem sobre o que existe.
export const RECURSO_POR_CANAL: Partial<Record<CanalPedido, ChaveRecurso>> = {
  mercadolivre: "integracao_mercado_livre",
  shopee: "integracao_shopee",
}

export function canaisLiberados(recursos: Recursos): CanalPedido[] {
  return (Object.keys(CANAL_LABEL) as CanalPedido[]).filter((canal) => {
    const recurso = RECURSO_POR_CANAL[canal]
    return !recurso || recursos[recurso]
  })
}
