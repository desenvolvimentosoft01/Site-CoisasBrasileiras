import { createHash } from "crypto"
import { getSegredo } from "@/lib/segredos"

// Upload de imagem pro Cloudinary via API REST assinada, sem depender do SDK
// oficial (evita mais uma dependencia pesada so pra um upload simples).
// So e usado quando as credenciais existem - em dev local sem elas, o
// upload cai pro disco local (ver app/api/admin/upload/route.ts), porque em
// producao na Vercel (serverless, sem disco persistente) o Cloudinary passa
// a ser obrigatorio.
//
// Credenciais configuraveis em Configuracoes > Integracoes (TAB_INTEGRACAO_SEGREDO,
// chaves "cloudinary_cloud_name"/"cloudinary_api_key"/"cloudinary_api_secret"),
// com fallback pras variaveis de ambiente CLOUDINARY_* se nada estiver
// configurado no banco.
export async function cloudinaryConfigurado(): Promise<boolean> {
  const [cloudName, apiKey, apiSecret] = await Promise.all([
    getSegredo("cloudinary_cloud_name"),
    getSegredo("cloudinary_api_key"),
    getSegredo("cloudinary_api_secret"),
  ])
  return !!(cloudName && apiKey && apiSecret)
}

// Assina os parametros conforme a regra do Cloudinary: concatena
// "chave=valor" em ordem alfabetica, separados por "&", acrescenta o
// api_secret no final e tira o SHA-1 - e o jeito deles de provar que o
// upload veio de quem tem a chave secreta, sem precisar expor ela no client.
function assinarParametros(parametros: Record<string, string>, apiSecret: string): string {
  const stringOrdenada = Object.keys(parametros)
    .sort()
    .map((chave) => `${chave}=${parametros[chave]}`)
    .join("&")
  return createHash("sha1").update(`${stringOrdenada}${apiSecret}`).digest("hex")
}

export async function uploadArquivoCloudinary(
  bytes: Buffer,
  pasta: string,
  tipoRecurso: "image" | "video" = "image"
): Promise<string> {
  const [cloudName, apiKey, apiSecret] = await Promise.all([
    getSegredo("cloudinary_cloud_name"),
    getSegredo("cloudinary_api_key"),
    getSegredo("cloudinary_api_secret"),
  ])

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary nao configurado")
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const assinatura = assinarParametros({ folder: pasta, timestamp }, apiSecret)

  const formData = new FormData()
  formData.append("file", new Blob([new Uint8Array(bytes)]))
  formData.append("api_key", apiKey)
  formData.append("timestamp", timestamp)
  formData.append("folder", pasta)
  formData.append("signature", assinatura)

  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${tipoRecurso}/upload`, {
    method: "POST",
    body: formData,
  })

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "")
    throw new Error(`Cloudinary respondeu ${resposta.status}: ${corpo}`)
  }

  const dados = await resposta.json()
  return dados.secure_url
}
