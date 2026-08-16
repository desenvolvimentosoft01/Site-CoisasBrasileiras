// Rotulos de exibicao pro codigo salvo em TAB_PEDIDO.forma_pagamento -
// mesmo codigo usado tanto pela Venda Balcao (escolhido manualmente) quanto
// pelo checkout do site (preenchido a partir do metodo aprovado no Mercado
// Pago, ver lib/mercadopago.ts). Centralizado aqui pra nenhuma tela mostrar
// o codigo cru (ex: "cartao_credito") pro usuario final.
export const FORMAS_PAGAMENTO_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  boleto: "Boleto",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
}

export function rotuloFormaPagamento(codigo: string | null): string {
  if (!codigo) return ""
  return FORMAS_PAGAMENTO_LABEL[codigo] ?? codigo
}

// Opcoes pro Select de forma de pagamento da Venda Balcao - so as escolhidas
// manualmente no balcao (o checkout do site preenche sozinho a partir do
// metodo aprovado no Mercado Pago, nunca aparece num <select>).
export const FORMAS_PAGAMENTO_BALCAO = [
  { valor: "dinheiro", rotulo: FORMAS_PAGAMENTO_LABEL.dinheiro },
  { valor: "pix", rotulo: FORMAS_PAGAMENTO_LABEL.pix },
  { valor: "boleto", rotulo: FORMAS_PAGAMENTO_LABEL.boleto },
  { valor: "cartao_credito", rotulo: FORMAS_PAGAMENTO_LABEL.cartao_credito },
  { valor: "cartao_debito", rotulo: FORMAS_PAGAMENTO_LABEL.cartao_debito },
]
