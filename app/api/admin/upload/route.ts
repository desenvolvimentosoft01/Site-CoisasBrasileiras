import { exigirSessao } from "@/lib/auth-servidor"
import { cloudinaryConfigurado, uploadArquivoCloudinary } from "@/lib/cloudinary"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const EXTENSOES_IMAGEM = ["jpg", "jpeg", "png", "webp", "gif"]
const EXTENSOES_VIDEO = ["mp4", "webm", "mov"]
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024 // 5MB
const TAMANHO_MAXIMO_VIDEO = 50 * 1024 * 1024 // 50MB
const PASTAS_PERMITIDAS = ["produtos", "categorias", "feedbacks", "loja", "sobre"]

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

  const extensao = (arquivo.name.split(".").pop() || "").toLowerCase()
  const ehVideo = EXTENSOES_VIDEO.includes(extensao)

  if (!ehVideo && !EXTENSOES_IMAGEM.includes(extensao)) {
    return NextResponse.json({ erro: "Formato de arquivo não suportado" }, { status: 400 })
  }

  const tamanhoMaximo = ehVideo ? TAMANHO_MAXIMO_VIDEO : TAMANHO_MAXIMO_IMAGEM
  if (arquivo.size > tamanhoMaximo) {
    return NextResponse.json(
      { erro: `Arquivo maior que ${tamanhoMaximo / (1024 * 1024)}MB` },
      { status: 400 }
    )
  }

  const bytes = Buffer.from(await arquivo.arrayBuffer())

  // Em ambiente serverless nao ha disco persistente - o Cloudinary e
  // obrigatorio la. Em dev local sem as credenciais configuradas, cai pro
  // disco local mesmo, pra nao exigir conta no Cloudinary so pra testar.
  if (cloudinaryConfigurado()) {
    try {
      const url = await uploadArquivoCloudinary(bytes, `coisas-brasileiras/${pasta}`, ehVideo ? "video" : "image")
      return NextResponse.json({ url })
    } catch (erro) {
      console.error("[upload] Falha no Cloudinary:", erro)
      return NextResponse.json({ erro: "Erro ao enviar arquivo" }, { status: 502 })
    }
  }

  const nomeArquivo = `${randomUUID()}.${extensao}`
  const pastaDestino = path.join(process.cwd(), "public", "uploads", pasta)
  await mkdir(pastaDestino, { recursive: true })
  await writeFile(path.join(pastaDestino, nomeArquivo), bytes)

  return NextResponse.json({ url: `/uploads/${pasta}/${nomeArquivo}` })
}
