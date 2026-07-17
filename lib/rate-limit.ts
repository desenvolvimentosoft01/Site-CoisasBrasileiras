// Limitador de tentativas simples, em memoria, para proteger rotas de login
// contra forca bruta. Funciona por instancia do processo Node - suficiente
// para o deploy atual (processo unico), mas nao se propaga entre instancias
// em ambientes serverless com varias replicas. Para producao com trafego
// alto, considerar um limitador compartilhado (ex: Redis/Upstash).

type Tentativa = { contagem: number; resetaEm: number }

const tentativas = new Map<string, Tentativa>()

const JANELA_MS = 15 * 60 * 1000 // 15 minutos
const LIMITE = 5

export function limiteExcedido(chave: string): boolean {
  const agora = Date.now()
  const registro = tentativas.get(chave)

  if (!registro || agora > registro.resetaEm) {
    tentativas.set(chave, { contagem: 1, resetaEm: agora + JANELA_MS })
    return false
  }

  registro.contagem += 1
  return registro.contagem > LIMITE
}

// Chamado apos um login bem-sucedido, para nao penalizar o usuario legitimo
// que so errou a senha uma vez antes de acertar.
export function limparTentativas(chave: string): void {
  tentativas.delete(chave)
}
