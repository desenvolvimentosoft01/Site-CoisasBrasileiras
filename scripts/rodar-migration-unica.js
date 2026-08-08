// Roda uma unica migration (uso: node scripts/rodar-migration-unica.js 046_marca.sql)
// sem depender do psql instalado na maquina.
const fs = require("fs")
const path = require("path")
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") })
const { Client } = require("pg")

async function main() {
  const arquivo = process.argv[2]
  if (!arquivo) {
    console.error("Uso: node scripts/rodar-migration-unica.js <arquivo.sql>")
    process.exit(1)
  }
  const caminho = path.join(process.cwd(), "migrations", arquivo)
  const sql = fs.readFileSync(caminho, "utf-8")

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query(sql)
    console.log(`Migration ${arquivo} aplicada com sucesso.`)
  } finally {
    await client.end()
  }
}

main().catch((erro) => {
  console.error("Erro ao aplicar migration:", erro.message)
  process.exit(1)
})
