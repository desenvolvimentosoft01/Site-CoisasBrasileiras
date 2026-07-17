import { query } from "@/lib/db"

export type ResultadoCupom =
  | { valido: true; cupomId: string; desconto: number }
  | { valido: false; erro: string }

// Reaplicada tanto na validacao "ao vivo" do checkout (pra mostrar o desconto
// antes de finalizar) quanto dentro da transacao que cria o pedido de verdade -
// nunca confiamos no valor de desconto vindo do client.
export async function validarCupom(
  codigo: string,
  clienteId: string,
  subtotal: number
): Promise<ResultadoCupom> {
  const [cupom] = await query(
    "SELECT * FROM TAB_CUPOM WHERE codigo = $1 AND ativo = true",
    [codigo.trim().toUpperCase()]
  )

  if (!cupom) {
    return { valido: false, erro: "Cupom nao encontrado" }
  }

  if (cupom.validade && new Date(cupom.validade) < new Date()) {
    return { valido: false, erro: "Cupom expirado" }
  }

  if (cupom.uso_maximo !== null && cupom.usos_atuais >= cupom.uso_maximo) {
    return { valido: false, erro: "Cupom esgotado" }
  }

  if (subtotal < Number(cupom.valor_minimo)) {
    return {
      valido: false,
      erro: `Valido para compras a partir de R$ ${Number(cupom.valor_minimo).toFixed(2)}`,
    }
  }

  if (cupom.primeira_compra_apenas) {
    const [pedidoAnterior] = await query(
      "SELECT id FROM TAB_PEDIDO WHERE cliente_id = $1 AND status = 'pago' LIMIT 1",
      [clienteId]
    )
    if (pedidoAnterior) {
      return { valido: false, erro: "Cupom valido apenas na primeira compra" }
    }
  }

  const desconto =
    cupom.tipo === "percentual"
      ? Math.round(((subtotal * Number(cupom.valor)) / 100) * 100) / 100
      : Math.min(Number(cupom.valor), subtotal)

  return { valido: true, cupomId: cupom.id, desconto }
}
