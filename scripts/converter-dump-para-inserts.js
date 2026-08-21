// Converte um dump com "COPY ... FROM stdin" em INSERTs, pra poder colar no
// SQL Editor do Supabase (uso: node scripts/converter-dump-para-inserts.js
// <entrada.sql> [saida.sql]).
//
// Por que precisa converter: COPY FROM stdin nao e SQL - os dados vem pelo
// protocolo de copia do cliente (o \copy do psql). O SQL Editor do Supabase e
// os drivers comuns so mandam texto, entao o Postgres tenta ler a primeira
// linha de dados como comando e da erro de sintaxe.
//
// Alem de converter, o arquivo gerado:
//   - esvazia cada tabela antes de recarregar, porque as migrations semeiam
//     configuracao/recursos/frete/tipos de entrega e o backup traz as mesmas
//     chaves - numa restauracao quem vale e o backup;
//   - ressincroniza as sequences de codigo no fim, senao o primeiro cadastro
//     novo colide com o indice unico de codigo.
const fs = require("fs")
const path = require("path")

const BARRA = "\\"

// Formato "text" do COPY: \N e NULL e a barra invertida escapa separador,
// quebra de linha e ela mesma. Sem desfazer isso, um endereco com "\t" no
// meio viraria coluna a mais.
const ESCAPES = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", [BARRA]: BARRA }

const NULO = BARRA + "N"
const FIM_DO_BLOCO = BARRA + "."

function lerCampo(bruto) {
  if (bruto === NULO) return null
  let saida = ""
  for (let i = 0; i < bruto.length; i++) {
    if (bruto[i] === BARRA && i + 1 < bruto.length) {
      const proximo = bruto[++i]
      saida += ESCAPES[proximo] !== undefined ? ESCAPES[proximo] : proximo
    } else {
      saida += bruto[i]
    }
  }
  return saida
}

const citar = (valor) => (valor === null ? "NULL" : `'${valor.replace(/'/g, "''")}'`)

function converter(texto) {
  const saida = []
  const tabelas = []
  let copiando = null

  for (const linha of texto.split(/\r?\n/)) {
    if (copiando) {
      if (linha === FIM_DO_BLOCO) {
        saida.push(copiando.linhas.length ? copiando.linhas.join(",\n") + ";" : "-- (sem linhas)")
        tabelas.push({ nome: copiando.tabela, colunas: copiando.colunas, total: copiando.linhas.length })
        copiando = null
        continue
      }
      if (linha === "") continue

      const valores = linha.split("\t").map(lerCampo).map(citar).join(", ")
      const primeira = copiando.linhas.length === 0
      const cabecalho = `DELETE FROM ${copiando.tabela};\nINSERT INTO ${copiando.tabela} (${copiando.colunas.join(", ")}) VALUES\n`
      copiando.linhas.push((primeira ? cabecalho : "") + `  (${valores})`)
      continue
    }

    const inicio = linha.match(/^COPY\s+([\w.]+)\s*\(([^)]+)\)\s+FROM\s+stdin;/i)
    if (inicio) {
      copiando = {
        tabela: inicio[1],
        colunas: inicio[2].split(",").map((coluna) => coluna.trim()),
        linhas: [],
      }
      continue
    }
    saida.push(linha)
  }

  if (copiando) throw new Error(`Bloco COPY de ${copiando.tabela} sem o fechamento`)
  return { sql: saida.join("\n"), tabelas }
}

// Guardado por to_regclass: nem toda coluna chamada "codigo" tem sequence.
// TAB_CUPOM ficou de fora na 058 porque o codigo dela e o texto da promocao
// ("BEMVINDO10"), e um setval ali daria erro de tipo.
function ressincronizarSequences(tabelas) {
  const comCodigo = tabelas.filter((tabela) => tabela.colunas.includes("codigo") && tabela.total > 0)
  if (comCodigo.length === 0) return ""

  const blocos = comCodigo.map((tabela) => {
    const semSchema = tabela.nome.replace(/^public\./, "")
    return [
      `  IF to_regclass('public.${semSchema}_codigo_seq') IS NOT NULL THEN`,
      `    PERFORM setval('${semSchema}_codigo_seq', (SELECT COALESCE(MAX(codigo), 1) FROM ${tabela.nome}));`,
      `  END IF;`,
    ].join("\n")
  })

  return [
    "",
    "-- ===== SEQUENCES =====",
    "-- Os codigos vieram nos dados; sem isto a sequence continua em 1 e o",
    "-- primeiro cadastro novo colide com o indice unico de codigo.",
    "DO $$",
    "BEGIN",
    blocos.join("\n"),
    "END $$;",
    "",
  ].join("\n")
}

const entrada = process.argv[2]
if (!entrada) {
  console.error("Uso: node scripts/converter-dump-para-inserts.js <entrada.sql> [saida.sql]")
  process.exit(1)
}
const saida = process.argv[3] || entrada.replace(/\.sql$/, "") + "-inserts.sql"

const { sql, tabelas } = converter(fs.readFileSync(entrada, "utf-8"))

// O setval entra antes do COMMIT pra ficar na mesma transacao da carga.
// A substituicao e por funcao de proposito: numa string de substituicao o
// "$$" do DO $$ seria lido como sequencia especial e viraria um "$" so.
const corpo = sql.replace(/\nCOMMIT;/, () => `\n${ressincronizarSequences(tabelas)}\nCOMMIT;`)
fs.writeFileSync(saida, corpo, "utf-8")

console.log(`${path.basename(saida)} gerado.`)
tabelas.forEach((tabela) => console.log(`  ${tabela.nome}: ${tabela.total} linha(s)`))
