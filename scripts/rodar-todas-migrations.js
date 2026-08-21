// Roda TODAS as migrations de migrations/ em ordem, do zero ou de onde parou
// (uso: node scripts/rodar-todas-migrations.js [--simular] [--forcar]).
//
// --simular mostra o que seria aplicado e nao escreve nada no banco. Rode
// isso primeiro: e a unica forma de conferir contra QUAL banco o DATABASE_URL
// aponta antes de alterar schema.
//
// Por que existe: aplicar 67 arquivos um a um com rodar-migration-unica.js e
// lento e da margem pra pular numero ou trocar a ordem - que e justamente o
// que quebra um banco novo. Aqui a ordem vem do nome do arquivo e nao tem
// como sair dela.
//
// O que ja rodou e pulado: a tabela _migracoes_aplicadas (criada na 004) diz
// o que este banco ja tem. As migrations 000-003 sao anteriores a ela e sao
// registradas pelo backfill da propria 004, entao rodar tudo de novo num
// banco ja povoado nao repete trabalho.
//
// Cada migration roda dentro da sua propria transacao: se uma falhar, ela nao
// deixa nada pela metade e o script para ali - as anteriores ficam aplicadas
// e commitadas, entao e so corrigir o arquivo e rodar o script de novo.
const fs = require("fs")
const path = require("path")
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") })
const { Client } = require("pg")

const PASTA = path.join(process.cwd(), "migrations")

// So os arquivos numerados: consultar_migrations_aplicadas.sql e consulta,
// nao faz parte do historico de schema.
function listarMigrations() {
  return fs
    .readdirSync(PASTA)
    .filter((nome) => /^\d{3}_.+\.sql$/.test(nome))
    .sort()
}

// Falha cedo se a numeracao tiver buraco ou numero repetido - nos dois casos
// o mais provavel e arquivo faltando no checkout, e rodar assim mesmo geraria
// um banco silenciosamente incompleto.
function validarSequencia(arquivos) {
  const versoes = arquivos.map((nome) => nome.slice(0, 3))
  const problemas = []

  versoes.forEach((versao, indice) => {
    if (versoes.indexOf(versao) !== indice) problemas.push(`numero ${versao} duplicado`)
    const esperado = String(indice).padStart(3, "0")
    if (versao !== esperado && versoes.indexOf(versao) === indice) {
      problemas.push(`esperava ${esperado} e encontrou ${versao}`)
    }
  })

  if (problemas.length > 0) {
    throw new Error(`Numeracao das migrations inconsistente: ${[...new Set(problemas)].join("; ")}`)
  }
}

async function versoesJaAplicadas(client) {
  // A tabela so existe a partir da 004 - num banco vazio ainda nao ha nada.
  // A checagem tem que ser uma consulta separada: um SELECT com WHERE
  // to_regclass(...) falharia no parse, porque o Postgres resolve a tabela
  // antes de avaliar a condicao.
  const { rows: [{ existe }] } = await client.query(
    "SELECT to_regclass('public._migracoes_aplicadas') IS NOT NULL AS existe"
  )
  if (!existe) return new Set()

  const { rows } = await client.query("SELECT versao FROM _migracoes_aplicadas")
  return new Set(rows.map((linha) => linha.versao))
}

async function main() {
  const forcar = process.argv.includes("--forcar")
  const simular = process.argv.includes("--simular")

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL nao definida (esperada em .env.local)")
  }

  const arquivos = listarMigrations()
  validarSequencia(arquivos)

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    const aplicadas = forcar ? new Set() : await versoesJaAplicadas(client)

    // Mostra contra qual banco vai rodar - sem a senha, que nao deve aparecer
    // em log nem em print de terminal colado num chamado.
    const { rows: [conexao] } = await client.query(
      "SELECT current_database() AS banco, inet_server_addr()::text AS servidor"
    )
    console.log(`Banco: ${conexao.banco} em ${conexao.servidor || "localhost"}${simular ? " (SIMULACAO - nada sera gravado)" : ""}`)
    console.log(`${arquivos.length} migrations encontradas, ${aplicadas.size} ja aplicadas neste banco.`)

    let executadas = 0
    for (const arquivo of arquivos) {
      const versao = arquivo.slice(0, 3)
      if (aplicadas.has(versao)) {
        console.log(`  - ${arquivo} (ja aplicada, pulando)`)
        continue
      }

      if (simular) {
        console.log(`  ~ ${arquivo} (seria aplicada)`)
        executadas++
        continue
      }

      const sql = fs.readFileSync(path.join(PASTA, arquivo), "utf-8")
      await client.query("BEGIN")
      try {
        await client.query(sql)
        await client.query("COMMIT")
      } catch (erro) {
        await client.query("ROLLBACK")
        throw new Error(`${arquivo}: ${erro.message}`)
      }
      console.log(`  + ${arquivo}`)
      executadas++
    }

    console.log(
      executadas === 0
        ? "Banco ja estava atualizado - nada a fazer."
        : simular
          ? `Simulacao: ${executadas} migration(s) seriam aplicadas. Rode sem --simular pra valer.`
          : `Pronto: ${executadas} migration(s) aplicada(s).`
    )
  } finally {
    await client.end()
  }
}

main().catch((erro) => {
  console.error("\nErro ao aplicar migrations:", erro.message)
  console.error("As migrations anteriores a essa continuam aplicadas. Corrija e rode o script de novo.")
  process.exit(1)
})
