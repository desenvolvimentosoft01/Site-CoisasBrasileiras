// Canal de venda - complementa TAB_PEDIDO.origem (site/balcao, macro) com um
// detalhe mais fino de onde a venda de fato aconteceu. Fixo (nao ha tela de
// cadastro de canais), mesmo padrao do in-mente-gestao.
export type CanalPedido = "site" | "whatsapp" | "instagram" | "balcao"

export const CANAL_LABEL: Record<CanalPedido, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  balcao: "Balcao",
}

export const CANAIS_VENDA_BALCAO: { valor: CanalPedido; rotulo: string }[] = [
  { valor: "balcao", rotulo: "Balcao (presencial)" },
  { valor: "whatsapp", rotulo: "WhatsApp" },
  { valor: "instagram", rotulo: "Instagram" },
]
