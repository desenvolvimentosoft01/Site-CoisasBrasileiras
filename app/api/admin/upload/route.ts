import { exigirSessao } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const EXTENSOES_PERMITIDAS = ["jpg", "jpeg", "png", "webp", "gif"]
const TAMANHO_MAXIMO = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const formData = await request.formData()
  const arquivo = formData.get("arquivo") as File | null

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

  const nomeArquivo = `${randomUUID()}.${extensao}`
  const pastaDestino = path.join(process.cwd(), "public", "uploads", "produtos")
  await mkdir(pastaDestino, { recursive: true })

  const bytes = Buffer.from(await arquivo.arrayBuffer())
  await writeFile(path.join(pastaDestino, nomeArquivo), bytes)

  return NextResponse.json({ url: `/uploads/produtos/${nomeArquivo}` })
}
