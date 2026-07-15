import { Pool } from "pg"

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
