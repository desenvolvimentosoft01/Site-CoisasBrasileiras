import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

// Download do XML de UMA nota de entrada. O export em lote (por competencia,
// pro contador) continua em /api/admin/compras/exportar-xml - aqui e o caso
// avulso: "preciso do XML daquela nota".
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [compra] = await query("SELECT chave_acesso, xml_nfe FROM TAB_COMPRA WHERE id = $1", [id])

  if (!compra) {
    return NextResponse.json({ erro: "Nota não encontrada" }, { status: 404 })
  }
  if (!compra.xml_nfe) {
    return NextResponse.json(
      { erro: "Essa entrada não tem XML guardado (lançamento manual ou anterior à guarda do arquivo)." },
      { status: 404 }
    )
  }

  return new NextResponse(compra.xml_nfe, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${compra.chave_acesso || id}-nfe.xml"`,
    },
  })
}
