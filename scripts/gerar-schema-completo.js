// Gera migrations/schema_completo.sql: todas as migrations numeradas
// concatenadas em ordem, num arquivo so pra colar no SQL Editor do Supabase
// (uso: node scripts/gerar-schema-completo.js).
//
// Por que gerado e nao escrito a mao: um schema consolidado mantido em
// paralelo vira mentira no primeiro dia em que alguem edita so um dos dois.
// Aqui a fonte da verdade continua sendo os arquivos de migrations/ - este
// script so cola tudo junto, e roda de novo a cada migration nova.
const fs = require("fs")
const path = require("path")

const PASTA = path.join(process.cwd(), "migrations")
const SAIDA = path.join(PASTA, "schema_completo.sql")

const arquivos = fs
  .readdirSync(PASTA)
  .filter((nome) => /^\d{3}_.+\.sql$/.test(nome))
  .sort()

// Mesma checagem do rodar-todas-migrations.js: buraco na numeracao quase
// sempre e arquivo faltando no checkout, e gerar assim daria um schema
// incompleto sem nenhum aviso.
arquivos.forEach((nome, indice) => {
  const esperado = String(indice).padStart(3, "0")
  if (nome.slice(0, 3) !== esperado) {
    throw new Error(`Numeracao inconsistente: esperava ${esperado} e encontrou ${nome}`)
  }
})

const cabecalho = `-- ============================================================
-- SCHEMA COMPLETO — COISAS BRASILEIRAS
--
-- ARQUIVO GERADO. Nao edite aqui: edite a migration correspondente em
-- migrations/ e rode "node scripts/gerar-schema-completo.js" de novo.
--
-- Sao as ${arquivos.length} migrations numeradas, na ordem, num arquivo so.
-- Serve pra criar um banco do zero colando tudo no SQL Editor do Supabase,
-- sem precisar de psql nem de Node na maquina.
--
-- USE SO EM BANCO NOVO/VAZIO. Num banco que ja tem dados, rode
-- "node scripts/rodar-todas-migrations.js", que pula o que ja foi aplicado.
--
-- O SQL Editor do Supabase roda tudo numa transacao unica: se qualquer
-- comando falhar, nada e gravado e o banco continua vazio.
--
-- Depois de rodar, crie o primeiro administrador:
--   node scripts/criar-admin.js "Nome do Admin" email@dominio.com
-- ============================================================

`

const corpo = arquivos
  .map((nome) => {
    const sql = fs.readFileSync(path.join(PASTA, nome), "utf-8").trim()
    return `-- ============================================================\n-- >>> ${nome}\n-- ============================================================\n\n${sql}\n`
  })
  .join("\n")

fs.writeFileSync(SAIDA, cabecalho + corpo, "utf-8")
console.log(`schema_completo.sql gerado com ${arquivos.length} migrations (${arquivos[0]} ate ${arquivos[arquivos.length - 1]}).`)
