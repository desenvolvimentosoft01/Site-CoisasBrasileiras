import { exigirAdmin } from "@/lib/auth-servidor"
import { garantirXmlNotaSaida } from "@/lib/notas-fiscais"
import { parseNfeParaDanfe } from "@/lib/nfe-xml"
import { gerarPdfDanfe } from "@/lib/pdf-danfe"
import { NextResponse } from "next/server"

// DANFE da nota de SAIDA do pedido, gerado do mesmo jeito que o da entrada
// (mesmo lib/pdf-danfe.tsx) a partir do XML autorizado - baixado do Bling na
// primeira vez e guardado no banco.
//
// Content-Disposition "inline" pelo mesmo motivo da entrada: o uso principal
// e abrir no visualizador e imprimir na hora.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  try {
    const xml = await garantirXmlNotaSaida(id)
    if (!xml) {
      return NextResponse.json(
        { erro: "Esse pedido ainda não tem NF-e autorizada, então não é possível gerar o DANFE." },
        { status: 404 }
      )
    }

    const dados = parseNfeParaDanfe(xml)
    const pdf = await gerarPdfDanfe(dados)
    const nomeArquivo = `danfe-${dados.chaveAcesso || dados.numero || id}.pdf`

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nomeArquivo}"`,
      },
    })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao gerar o DANFE" },
      { status: 500 }
    )
  }
}
