import { exigirSessao } from "@/lib/auth-servidor"
import { cloudinaryConfigurado, uploadImagemCloudinary } from "@/lib/cloudinary"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const EXTENSOES_PERMITIDAS = ["jpg", "jpeg", "png", "webp", "gif"]
const TAMANHO_MAXIMO = 5 * 1024 * 1024 // 5MB
const PASTAS_PERMITIDAS = ["produtos", "categorias", "feedbacks", "loja"]

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const formData = await request.formData()
  const arquivo = formData.get("arquivo") as File | null
  const pastaSolicitada = formData.get("pasta") as string | null
  const pasta = PASTAS_PERMITIDAS.includes(pastaSolicitada || "") ? pastaSolicitada! : "produtos"

  if (!arquivo) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado" }, { status: 400 })
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return NextResponse.json({ erro: "Arquivo maior que 5MB" }, { status: 400 })
  }

  const extensao = (arquivo.name.split(".").pop() || "").toLowerCase()
  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    return NextResponse.json({ erro: "Formato de imagem nao suportado" }, { status: 400 })
  }

  const bytes = Buffer.from(await arquivo.arrayBuffer())

  // Em producao (Vercel) nao ha disco persistente - o Cloudinary e
  // obrigatorio la. Em dev local sem as credenciais configuradas, cai pro
  // disco local mesmo, pra nao exigir conta no Cloudinary so pra testar.
  if (cloudinaryConfigurado()) {
    try {
      const url = await uploadImagemCloudinary(bytes, `coisas-brasileiras/${pasta}`)
      return NextResponse.json({ url })
    } catch (erro) {
      console.error("[upload] Falha no Cloudinary:", erro)
      return NextResponse.json({ erro: "Erro ao enviar imagem" }, { status: 502 })
    }
  }

  const nomeArquivo = `${randomUUID()}.${extensao}`
  const pastaDestino = path.join(process.cwd(), "public", "uploads", pasta)
  await mkdir(pastaDestino, { recursive: true })
  await writeFile(path.join(pastaDestino, nomeArquivo), bytes)

  return NextResponse.json({ url: `/uploads/${pasta}/${nomeArquivo}` })
}
