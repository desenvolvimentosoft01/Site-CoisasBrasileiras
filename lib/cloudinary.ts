import { createHash } from "crypto"

// Upload de imagem pro Cloudinary via API REST assinada, sem depender do SDK
// oficial (evita mais uma dependencia pesada so pra um upload simples).
// So e usado quando as credenciais existem - em dev local sem elas, o
// upload cai pro disco local (ver app/api/admin/upload/route.ts), porque em
// producao na Vercel (serverless, sem disco persistente) o Cloudinary passa
// a ser obrigatorio.
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

export function cloudinaryConfigurado(): boolean {
  return !!(CLOUD_NAME && API_KEY && API_SECRET)
}

// Assina os parametros conforme a regra do Cloudinary: concatena
// "chave=valor" em ordem alfabetica, separados por "&", acrescenta o
// api_secret no final e tira o SHA-1 - e o jeito deles de provar que o
// upload veio de quem tem a chave secreta, sem precisar expor ela no client.
function assinarParametros(parametros: Record<string, string>): string {
  const stringOrdenada = Object.keys(parametros)
    .sort()
    .map((chave) => `${chave}=${parametros[chave]}`)
    .join("&")
  return createHash("sha1").update(`${stringOrdenada}${API_SECRET}`).digest("hex")
}

export async function uploadImagemCloudinary(bytes: Buffer, pasta: string): Promise<string> {
  if (!cloudinaryConfigurado()) {
    throw new Error("Cloudinary nao configurado")
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const assinatura = assinarParametros({ folder: pasta, timestamp })

  const formData = new FormData()
  formData.append("file", new Blob([new Uint8Array(bytes)]))
  formData.append("api_key", API_KEY!)
  formData.append("timestamp", timestamp)
  formData.append("folder", pasta)
  formData.append("signature", assinatura)

  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
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
