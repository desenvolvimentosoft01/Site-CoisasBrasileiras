// Isolado de lib/clube.ts de proposito: aquele arquivo importa `pg` e o SDK
// do Mercado Pago (so servidor). Essa funcao e pura e precisa ser importavel
// tambem por Client Components (ex: components/loja/produto-card.tsx) - se
// ficasse em lib/clube.ts, o bundler tentaria incluir `pg`/`mercadopago` no
// bundle do client e o build quebra (modulos nativos do Node: dns, fs, net...).

// Preco do Clube por produto pode ser cadastrado em R$ (fixo) ou em % de
// desconto sobre o preco normal - calcula sempre os dois lados (valor final
// em R$ e o percentual equivalente) pra exibir ambos em qualquer lugar do
// site que mostre preco de produto (card de listagem, pagina individual etc),
// nao importa qual tipo o lojista escolheu no cadastro.
export function calcularPrecoClube(
  precoNormal: string | number,
  precoClube: string | number,
  tipo: "fixo" | "percentual"
): { valorFinal: number; percentual: number } {
  const normal = Number(precoNormal)
  const clube = Number(precoClube)

  const valorFinal = tipo === "percentual" ? Math.round(normal * (1 - clube / 100) * 100) / 100 : clube
  const percentual = tipo === "percentual" ? clube : Math.round((1 - clube / normal) * 100)

  return { valorFinal, percentual }
}
