// Rotulos e logica de exibicao de status de pedido, compartilhados entre
// Venda Balcao, lista de Pedidos e o widget "Ultimos pedidos" do Dashboard -
// centralizado aqui pra evitar que cada tela decida "abandonado" de um jeito
// diferente.
export const ROTULOS_STATUS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

// "Aguardando pagamento" pode significar boleto/pix realmente em
// processamento OU carrinho abandonado (cliente nunca voltou pra pagar) - o
// sistema nao tem como saber com certeza (o Mercado Pago so avisa quando o
// pagamento e de fato tentado), entao usamos um limite de tempo como
// indicativo visual, sem mudar o status real no banco.
const HORAS_LIMITE_ABANDONADO = 24

export function statusExibicao(status: string, criadoEm: string): string {
  if (status !== "aguardando_pagamento") return ROTULOS_STATUS[status] ?? status
  const horasDesdeCriacao = (Date.now() - new Date(criadoEm).getTime()) / 3_600_000
  return horasDesdeCriacao > HORAS_LIMITE_ABANDONADO ? "Provavelmente abandonado" : "Aguardando pagamento"
}
