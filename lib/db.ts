import { Pool, type PoolClient } from "pg"

// DEBUG TEMPORARIO - remover depois de confirmar qual DATABASE_URL o processo recebe em producao.
console.log(
  "[debug] DATABASE_URL recebida:",
  (process.env.DATABASE_URL ?? "(vazia)").replace(/:[^:@]*@/, ":***@")
)

const ehLocalhost = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // Supabase (e Neon) exigem SSL; banco local nao tem certificado, entao so liga fora de localhost.
  ssl: ehLocalhost ? undefined : { rejectUnauthorized: false },
})

export async function query(sql: string, params?: unknown[]) {
  const resultado = await pool.query(sql, params)
  return resultado.rows
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
