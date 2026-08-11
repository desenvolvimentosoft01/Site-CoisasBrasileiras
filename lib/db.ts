import { Pool, type PoolClient } from "pg"
import { setDefaultResultOrder } from "dns"

// O host do pooler do Supabase tem registro AAAA (IPv6), e o Node por padrao
// tenta IPv6 primeiro - em VPS sem rota IPv6 de saida (ex: alguns planos da
// Hostinger) isso da ECONNREFUSED direto num endereco IPv6, mesmo com o IPv4
// funcionando normalmente. Forcar IPv4 primeiro evita essa tentativa que
// sempre falha nesse tipo de ambiente.
setDefaultResultOrder("ipv4first")

const ehLocalhost = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // Supabase (e Neon) exigem SSL; banco local nao tem certificado, entao so liga fora de localhost.
  ssl: ehLocalhost ? undefined : { rejectUnauthorized: false },
})

// Erros de conexao ociosa (o pooler do Supabase/Neon derruba conexoes idle do
// lado servidor antes do idleTimeoutMillis do cliente) sao transitorios -
// uma unica tentativa extra resolve sem precisar propagar o erro pra tela.
const ERROS_CONEXAO_TRANSITORIOS = ["ECONNRESET", "ETIMEDOUT", "Connection terminated"]

function ehErroTransitorio(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  const codigo = (erro as { code?: string })?.code
  return ERROS_CONEXAO_TRANSITORIOS.some((padrao) => mensagem.includes(padrao) || codigo === padrao)
}

export async function query(sql: string, params?: unknown[]) {
  try {
    const resultado = await pool.query(sql, params)
    return resultado.rows
  } catch (erro) {
    if (!ehErroTransitorio(erro)) throw erro
    const resultado = await pool.query(sql, params)
    return resultado.rows
  }
}

// Para operacoes que precisam de varias queries atomicas (ex: criar pedido +
// itens + baixar estoque). O callback recebe um client dedicado com a mesma
// assinatura de `query`, ja dentro de uma transacao.
export async function transacao<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wrapper generico sobre pg, linhas tem forma variavel por chamador
  callback: (queryCliente: (sql: string, params?: unknown[]) => Promise<any[]>) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect()
  try {
    await client.query("BEGIN")
    const resultado = await callback(async (sql, params) => (await client.query(sql, params)).rows)
    await client.query("COMMIT")
    return resultado
  } catch (erro) {
    await client.query("ROLLBACK")
    throw erro
  } finally {
    client.release()
  }
}
