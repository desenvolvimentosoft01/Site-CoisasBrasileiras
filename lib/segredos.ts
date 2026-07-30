import { query } from "@/lib/db"

// Segredos de integracao (Frenet, Mercado Pago, Email) configuraveis pelo
// admin em Configuracoes > Integracoes, guardados em TAB_INTEGRACAO_SEGREDO
// (isolada de TAB_CONFIGURACAO de proposito, mesmo motivo do Bling - nunca
// pode vazar num endpoint que devolve config geral). Cai pra variavel de
// ambiente se nao houver nada configurado no banco - no deploy atual, nada
// quebra so por essa tabela estar vazia.
//
// Cache curto em memoria: essas funcoes sao chamadas em quase toda cotacao
// de frete/pagamento/email, e nao faz sentido bater no banco toda vez -
// mas o TTL baixo garante que uma troca de token pelo admin reflete rapido,
// sem precisar reiniciar o processo.
const TTL_MS = 30_000
const cache = new Map<string, { valor: string | null; expiraEm: number }>()

export async function getSegredo(chave: string): Promise<string | null> {
  const agora = Date.now()
  const emCache = cache.get(chave)
  if (emCache && emCache.expiraEm > agora) return emCache.valor

  const [linha] = await query("SELECT valor FROM TAB_INTEGRACAO_SEGREDO WHERE chave = $1", [chave])
  const valor = linha?.valor || process.env[chave.toUpperCase()] || null
  cache.set(chave, { valor, expiraEm: agora + TTL_MS })
  return valor
}

export async function setSegredo(chave: string, valor: string | null): Promise<void> {
  await query(
    `INSERT INTO TAB_INTEGRACAO_SEGREDO (chave, valor, atualizado_em) VALUES ($1, $2, NOW())
     ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
    [chave, valor || null]
  )
  cache.delete(chave)
}

// Pra tela de Configuracoes mostrar "configurado"/"nao configurado" sem
// nunca devolver o valor real do segredo pro navegador.
export async function segredoConfigurado(chave: string): Promise<boolean> {
  return Boolean(await getSegredo(chave))
}
