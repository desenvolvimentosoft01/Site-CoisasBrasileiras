import { exigirAdmin } from "@/lib/auth-servidor"
import { garantirXmlNotaSaida } from "@/lib/notas-fiscais"
import { NextResponse } from "next/server"

// Download do XML autorizado da nota de saida. "attachment" (e nao inline
// como o DANFE): XML nao se le na tela, ele e o arquivo que vai pro contador
// e pra guarda de 5 anos.
//
// O nome do arquivo e a chave de acesso, que e a convencao usada pelos
// sistemas fiscais e a que o contador espera receber.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  try {
    const xml = await garantirXmlNotaSaida(id)
    if (!xml) {
      return NextResponse.json(
        { erro: "Esse pedido ainda não tem NF-e autorizada, então não há XML para baixar." },
        { status: 404 }
      )
    }

    const chave = xml.match(/Id="NFe(\d{44})"/)?.[1]

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${chave ?? id}-nfe.xml"`,
      },
    })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao baixar o XML" },
      { status: 500 }
    )
  }
}
