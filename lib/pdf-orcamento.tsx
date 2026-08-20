import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer"
import { NOME_SISTEMA, FABRICANTE_SISTEMA } from "@/lib/constantes"

function numeroFormatado(n: number) {
  return `OR.${String(n).padStart(4, "0")}`
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#1e293b" },
  header: { textAlign: "center", borderBottom: "1 solid #cbd5e1", paddingBottom: 12, marginBottom: 12 },
  lojaNome: { fontSize: 14, fontWeight: 700, marginBottom: 2, color: "#065f46" },
  titulo: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 2 },
  centro: { textAlign: "center" },
  cinza: { color: "#64748b" },
  tabela: { marginTop: 16, marginBottom: 12 },
  linhaCabecalho: { flexDirection: "row", borderBottom: "1.5 solid #1e293b", paddingBottom: 4, fontWeight: 700 },
  linha: { flexDirection: "row", borderBottom: "0.5 solid #e2e8f0", paddingVertical: 4 },
  colDescricao: { flex: 3 },
  colQtde: { flex: 1, textAlign: "right" },
  colValor: { flex: 1.3, textAlign: "right" },
  colTotal: { flex: 1.3, textAlign: "right", fontWeight: 700 },
  totais: { alignItems: "flex-end", marginTop: 8 },
  totalFinal: { fontSize: 13, fontWeight: 700, marginTop: 2, color: "#065f46" },
  condicoes: { marginTop: 16 },
  assinaturaSistema: { marginTop: 20, fontSize: 7, textAlign: "right", color: "#777777" },
  condicoesTitulo: { fontWeight: 700, marginBottom: 4 },
})

type ItemPdf = { id: string; descricao: string; quantidade: number; valor_unitario: number; subtotal: number }

export async function gerarPdfOrcamento(params: {
  nomeLoja: string
  numero: number
  titulo: string | null
  clienteNome: string
  criadoEm: Date
  itens: ItemPdf[]
  subtotal: number
  desconto: number
  total: number
  condicoes: string | null
}): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.lojaNome}>{params.nomeLoja}</Text>
        </View>

        <View style={s.centro}>
          <Text style={s.titulo}>{params.titulo || "Orcamento"}</Text>
          <Text style={s.cinza}>{numeroFormatado(params.numero)}</Text>
          <Text>{params.clienteNome}</Text>
          <Text style={s.cinza}>Criado em {params.criadoEm.toLocaleDateString("pt-BR")}</Text>
        </View>

        <View style={s.tabela}>
          <View style={s.linhaCabecalho}>
            <Text style={s.colDescricao}>Item</Text>
            <Text style={s.colQtde}>Qtde.</Text>
            <Text style={s.colValor}>Valor unit.</Text>
            <Text style={s.colTotal}>Total</Text>
          </View>
          {params.itens.map((item) => (
            <View key={item.id} style={s.linha}>
              <Text style={s.colDescricao}>{item.descricao}</Text>
              <Text style={s.colQtde}>{item.quantidade}</Text>
              <Text style={s.colValor}>{formatarMoeda(item.valor_unitario)}</Text>
              <Text style={s.colTotal}>{formatarMoeda(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totais}>
          {params.desconto > 0 && (
            <>
              <Text style={s.cinza}>Subtotal: {formatarMoeda(params.subtotal)}</Text>
              <Text style={s.cinza}>Desconto: -{formatarMoeda(params.desconto)}</Text>
            </>
          )}
          <Text style={s.totalFinal}>Total: {formatarMoeda(params.total)}</Text>
        </View>

        {params.condicoes && (
          <View style={s.condicoes}>
            <Text style={s.condicoesTitulo}>Condicoes</Text>
            <Text>{params.condicoes}</Text>
          </View>
        )}

        {/* Identificacao de quem gerou o documento - mesma assinatura do
            DANFE, pra que qualquer papel que sai do sistema diga de onde veio. */}
        <Text style={s.assinaturaSistema}>
          {NOME_SISTEMA} — {FABRICANTE_SISTEMA}
        </Text>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
