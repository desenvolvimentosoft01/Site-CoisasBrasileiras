import { Pool, type PoolClient } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
})

export async function query(sql: string, params?: unknown[]) {
  const resultado = await pool.query(sql, params)
  return resultado.rows
}

// Para operacoes que precisam de varias queries atomicas (ex: criar pedido +
// itens + baixar estoque). O callback recebe um client dedicado com a mesma
// assinatura de `query`, ja dentro de uma transacao.
export async function transacao<T>(
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
