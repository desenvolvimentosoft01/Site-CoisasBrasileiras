// Cria (ou reseta a senha de) um usuario administrador do painel.
// Uso: node scripts/criar-admin.js "Nome Completo" email@dominio.com [papel]
//   papel: "admin" (padrao) ou "operador"
//
// A senha e digitada no terminal (nao aparece na tela, nao fica em historico
// de comando nem em nenhum arquivo) - assim nenhuma senha real precisa ser
// commitada no projeto pra criar o primeiro acesso.

const path = require("path")
const { Client } = require(path.join(process.cwd(), "node_modules", "pg"))
const bcrypt = require(path.join(process.cwd(), "node_modules", "bcryptjs"))

require("dotenv").config({ path: path.join(process.cwd(), ".env.local") })

const CTRL_C = ""
const ENTER = ["\n", "\r"]
const BACKSPACE = ["", ""]

function perguntarSenha(mensagem) {
  return new Promise((resolve) => {
    process.stdout.write(mensagem)
    const stdin = process.stdin
    stdin.resume()
    stdin.setRawMode(true)
    stdin.setEncoding("utf8")

    let senha = ""
    function onData(char) {
      char = char.toString()
      if (ENTER.includes(char)) {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.removeListener("data", onData)
        process.stdout.write("\n")
        resolve(senha)
        return
      }
      if (char === CTRL_C) {
        process.exit(1)
      }
      if (BACKSPACE.includes(char)) {
        senha = senha.slice(0, -1)
        return
      }
      senha += char
    }
    stdin.on("data", onData)
  })
}

async function main() {
  const [nome, email, papel] = process.argv.slice(2)

  if (!nome || !email) {
    console.error('Uso: node scripts/criar-admin.js "Nome Completo" email@dominio.com [admin|operador]')
    process.exit(1)
  }
  const papelFinal = papel === "operador" ? "operador" : "admin"

  const senha = await perguntarSenha("Senha (minimo 8 caracteres, nao aparece na tela): ")
  if (senha.length < 8) {
    console.error("Senha precisa ter pelo menos 8 caracteres.")
    process.exit(1)
  }
  const confirmacao = await perguntarSenha("Confirme a senha: ")
  if (senha !== confirmacao) {
    console.error("As senhas nao coincidem.")
    process.exit(1)
  }

  const senhaHash = await bcrypt.hash(senha, 10)

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  await client.query(
    `INSERT INTO TAB_USUARIO_ADMIN (nome, email, senha_hash, papel, ativo)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (email) DO UPDATE SET senha_hash = $3, nome = $1, papel = $4, ativo = true`,
    [nome, email, senhaHash, papelFinal]
  )

  await client.end()
  console.log(`Usuario "${email}" criado/atualizado com papel "${papelFinal}".`)
}

main().catch((erro) => {
  console.error("Erro:", erro.message)
  process.exit(1)
})
