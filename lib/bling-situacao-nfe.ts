// Codigos de situacao de NF-e do Bling - mesma tabela usada em Compras >
// Notas do Bling (notas de entrada) e aqui pra nota de venda emitida pelo
// pedido. Compartilhado pra nao duplicar o mapeamento nos dois lugares.
export const SITUACAO_NFE_BLING_LABEL: Record<number, string> = {
  1: "Pendente",
  2: "Cancelada",
  3: "Aguardando recibo",
  4: "Rejeitada",
  5: "Autorizada",
  6: "Emitida DANFE",
  7: "Registrada",
  8: "Aguardando protocolo",
  9: "Denegada",
  10: "Consulta situacao",
  11: "Bloqueada",
}
