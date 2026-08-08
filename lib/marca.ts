import { headers } from "next/headers"

export type Marca = "colorido" | "branco"

// Decide qual marca mostrar no site publico a partir do dominio de acesso.
// So existe 1 dominio "branco" configuravel (porcelanasbrancas.com); qualquer
// outro host (incluindo coisasbrasileiras.com e localhost em dev) cai em
// "colorido" - e o comportamento atual do site, sem mudanca nenhuma ate o
// dominio do Porcelanas ser apontado pra esse mesmo deploy.
export function resolverMarca(host: string | null | undefined): Marca {
  if (!host) return "colorido"
  const dominioBranco = process.env.DOMINIO_BRANCO
  if (!dominioBranco) return "colorido"

  const hostLimpo = host.toLowerCase().replace(/^www\./, "").split(":")[0]
  const alvoLimpo = dominioBranco.toLowerCase().replace(/^www\./, "").split(":")[0]

  return hostLimpo === alvoLimpo ? "branco" : "colorido"
}

// Mesma ideia, mas le o host direto da requisicao (Server Component) - usar
// em vez de resolverMarca() sempre que nao se tiver o host em maos.
export async function resolverMarcaAtual(): Promise<Marca> {
  const cabecalhos = await headers()
  return resolverMarca(cabecalhos.get("host"))
}
