import { exigirAdmin } from "@/lib/auth-servidor"
import { parseNfeXml } from "@/lib/nfe-xml"
import { NextResponse } from "next/server"

const TAMANHO_MAXIMO = 2 * 1024 * 1024 // 2MB - XML de NF-e e texto, nunca deveria passar disso

// So le e valida o XML (sem gravar nada no banco) - fornecedor/compra so sao
// criados quando o admin de fato confirma o cadastro da compra na tela.
export async function POST(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const formData = await request.formData()
  const arquivo = formData.get("arquivo") as File | null

  if (!arquivo) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado" }, { status: 400 })
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return NextResponse.json({ erro: "Arquivo maior que 2MB - nao parece ser um XML de NF-e valido" }, { status: 400 })
  }
  if (!arquivo.name.toLowerCase().endsWith(".xml")) {
    return NextResponse.json({ erro: "Envie um arquivo .xml" }, { status: 400 })
  }

  try {
    const texto = await arquivo.text()
    const dados = parseNfeXml(texto)
    return NextResponse.json(dados)
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao ler o XML" },
      { status: 400 }
    )
  }
}
