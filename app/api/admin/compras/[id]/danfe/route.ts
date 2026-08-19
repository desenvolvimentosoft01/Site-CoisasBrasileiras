import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { parseNfeParaDanfe } from "@/lib/nfe-xml"
import { gerarPdfDanfe } from "@/lib/pdf-danfe"
import { NextResponse } from "next/server"

// Gera o DANFE (representacao grafica da NF-e) a partir do XML guardado na
// entrada. Devolve com Content-Disposition "inline": assim o navegador abre
// no visualizador de PDF, onde o operador ve e imprime direto - que e o uso
// principal. Baixar continua possivel pelo proprio visualizador.
//
// So funciona pra nota importada por XML: entrada lancada na mao nao tem
// arquivo, e nota importada antes da migration 054 nao teve o XML guardado.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [compra] = await query(
    "SELECT numero_nota, chave_acesso, xml_nfe FROM TAB_COMPRA WHERE id = $1",
    [id]
  )

  if (!compra) {
    return NextResponse.json({ erro: "Compra não encontrada" }, { status: 404 })
  }
  if (!compra.xml_nfe) {
    return NextResponse.json(
      { erro: "Essa entrada não tem XML guardado, então não é possível gerar o DANFE." },
      { status: 404 }
    )
  }

  try {
    const dados = parseNfeParaDanfe(compra.xml_nfe)
    const pdf = await gerarPdfDanfe(dados)
    const nomeArquivo = `danfe-${compra.chave_acesso || compra.numero_nota || id}.pdf`

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
