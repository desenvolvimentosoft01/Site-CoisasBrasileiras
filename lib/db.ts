import { Pool, type PoolClient } from "pg"
import { setDefaultResultOrder } from "dns"

// O host do pooler do Supabase tem registro AAAA (IPv6), e o Node por padrao
// tenta IPv6 primeiro - em VPS sem rota IPv6 de saida (ex: alguns planos da
// Hostinger) isso da ECONNREFUSED direto num endereco IPv6, mesmo com o IPv4
// funcionando normalmente. Forcar IPv4 primeiro evita essa tentativa que
// sempre falha nesse tipo de ambiente.
setDefaultResultOrder("ipv4first")

const ehLocalhost = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "")

// Quantas conexoes ESTE processo abre. O limite que importa nao e o do
// processo e sim o do pooler do Supabase (15 em session mode): a Hostinger
// sobe varias instancias do app, cada uma com o seu pool, entao o total e
// max x numero de instancias. Com 10 aqui, 2 instancias ja estouram e toda
// query passa a falhar com EMAXCONNSESSION.
//
// 3 e um teto conservador de proposito - cabem 5 instancias dentro dos 15. Se
// a maquina crescer (ou o plano do banco aumentar o limite), ajuste por
// DB_POOL_MAX em vez de mexer no codigo.
const MAX_CONEXOES = Number(process.env.DB_POOL_MAX) || 3

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: MAX_CONEXOES,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // Supabase (e Neon) exigem SSL; banco local nao tem certificado, entao so liga fora de localhost.
  ssl: ehLocalhost ? undefined : { rejectUnauthorized: false },
})

// Erros de conexao ociosa (o pooler do Supabase/Neon derruba conexoes idle do
// lado servidor antes do idleTimeoutMillis do cliente) sao transitorios -
// uma unica tentativa extra resolve sem precisar propagar o erro pra tela.
const ERROS_CONEXAO_TRANSITORIOS = ["ECONNRESET", "ETIMEDOUT", "Connection terminated"]

// Pooler lotado (todas as instancias do app somadas passaram do limite do
// plano). Tambem passa, mas so depois de esperar: repetir na hora com o
// pooler cheio so aumenta a fila.
const ERRO_POOLER_LOTADO = "EMAXCONNSESSION"

function ehErroTransitorio(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  const codigo = (erro as { code?: string })?.code
  return ERROS_CONEXAO_TRANSITORIOS.some((padrao) => mensagem.includes(padrao) || codigo === padrao)
}

function ehPoolerLotado(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return mensagem.includes(ERRO_POOLER_LOTADO) || mensagem.includes("max clients reached")
}

export async function query(sql: string, params?: unknown[]) {
  try {
    const resultado = await pool.query(sql, params)
    return resultado.rows
  } catch (erro) {
    if (ehPoolerLotado(erro)) {
      // Meio segundo costuma bastar: a conexao que estourou o limite e de
      // outra requisicao que ja esta terminando.
      await new Promise((resolver) => setTimeout(resolver, 500))
      const resultado = await pool.query(sql, params)
      return resultado.rows
    }
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
