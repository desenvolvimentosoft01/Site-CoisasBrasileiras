import { Document, Page, StyleSheet, Text, View, Image, renderToBuffer } from "@react-pdf/renderer"
import { toBuffer } from "bwip-js/node"
import type { DadosDanfe, ItemDanfe, ParticipanteDanfe } from "@/lib/nfe-xml"
import { NOME_SISTEMA, FABRICANTE_SISTEMA } from "@/lib/constantes"

// DANFE - Documento Auxiliar da Nota Fiscal Eletronica.
//
// O layout NAO e livre: segue o Manual de Orientacao do Contribuinte (Anexo I
// - "Layout do DANFE"), que define os quadros, a ordem e os rotulos. Por isso
// este arquivo e cheio de caixinha com titulo em maiuscula: cada uma e um
// quadro previsto no manual, na ordem prevista:
//   1. Canhoto (recibo de entrega)
//   2. Identificacao do emitente + bloco do DANFE + chave de acesso
//   3. Natureza da operacao / protocolo de autorizacao
//   4. Destinatario / remetente
//   5. Fatura / duplicatas (so quando a nota tem cobranca)
//   6. Calculo do imposto
//   7. Transportador / volumes transportados
//   8. Dados do produto / servico
//   9. Dados adicionais
//
// O DANFE e so a representacao grafica: quem tem valor fiscal e o XML
// autorizado. Por isso a nota sem protocolo sai marcada como "SEM VALOR
// FISCAL" - imprimir um DANFE de XML nao autorizado como se valesse seria
// enganoso.

const PRETO = "#000000"

const s = StyleSheet.create({
  pagina: { paddingHorizontal: 18, paddingVertical: 14, fontSize: 6, fontFamily: "Helvetica" },

  // Os quadros do DANFE sao delimitados por fio - a borda fina em todo bloco
  // e o que da o "cara de DANFE" e o que o manual pede.
  quadro: { borderWidth: 0.7, borderColor: PRETO },
  linha: { flexDirection: "row" },
  celula: { borderRightWidth: 0.7, borderColor: PRETO, paddingHorizontal: 3, paddingVertical: 2 },
  celulaFim: { paddingHorizontal: 3, paddingVertical: 2 },
  rotulo: { fontSize: 5, color: "#333333" },
  valor: { fontSize: 7 },
  valorForte: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  tituloBloco: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    marginTop: 3,
    marginBottom: 1,
  },

  canhotoTexto: { fontSize: 5.5 },

  emitenteNome: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  danfeTitulo: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "center" },
  danfeLegenda: { fontSize: 5, textAlign: "center" },
  chave: { fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "center" },
  codigoBarras: { height: 32, marginVertical: 2 },

  cabecalhoTabela: { fontSize: 5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  celulaTabela: { fontSize: 5.5, paddingHorizontal: 2, paddingVertical: 1.5 },

  assinaturaSistema: { fontSize: 5, textAlign: "right", marginTop: 2, color: "#555555" },

  semValorFiscal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingVertical: 3,
  },
})

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatarQuantidade(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function formatarData(data: string | null): string {
  if (!data) return ""
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}

// Mascara de CNPJ (14) ou CPF (11) - o DANFE mostra os dois formatados, e o
// participante pode ser pessoa fisica (comum em devolucao de consumidor).
function formatarDocumento(documento: string): string {
  const digitos = documento.replace(/\D/g, "")
  if (digitos.length === 14) {
    return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  }
  if (digitos.length === 11) {
    return digitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
  }
  return documento
}

function formatarCep(cep: string | null): string {
  if (!cep) return ""
  return cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2")
}

// A chave vai impressa em grupos de 4 - e assim que o manual manda, pra
// facilitar a digitacao manual no portal da NF-e.
function formatarChave(chave: string | null): string {
  if (!chave) return ""
  return chave.replace(/(\d{4})(?=\d)/g, "$1 ")
}

function enderecoLinha(participante: ParticipanteDanfe): string {
  const partes = [participante.logradouro, participante.numero, participante.bairro].filter(Boolean)
  return partes.join(", ")
}

// modFrete conforme a tabela da NF-e. O DANFE imprime o codigo e o texto.
const MODALIDADES_FRETE: Record<string, string> = {
  "0": "0-Emitente",
  "1": "1-Destinatário",
  "2": "2-Terceiros",
  "3": "3-Próprio/Remetente",
  "4": "4-Próprio/Destinatário",
  "9": "9-Sem frete",
}

async function gerarCodigoBarrasChave(chave: string): Promise<string> {
  // Code 128C: e o padrao exigido pelo manual pra chave de acesso da NF-e
  // (44 digitos). O bwip-js devolve PNG, que o @react-pdf embute como Image.
  const png = await toBuffer({
    bcid: "code128",
    text: chave,
    scale: 2,
    height: 12,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
  })
  return `data:image/png;base64,${Buffer.from(png).toString("base64")}`
}

function Campo({
  rotulo,
  valor,
  largura,
  ultimo,
  forte,
}: {
  rotulo: string
  valor: string
  largura: string
  ultimo?: boolean
  forte?: boolean
}) {
  return (
    <View style={[ultimo ? s.celulaFim : s.celula, { width: largura }]}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Text style={forte ? s.valorForte : s.valor}>{valor}</Text>
    </View>
  )
}

// Larguras das colunas do quadro "DADOS DO PRODUTO/SERVICO", na ordem do
// manual. Somam 100%.
const COLUNAS_ITENS: { titulo: string; largura: string; alinhamento: "left" | "right" | "center" }[] = [
  { titulo: "CÓDIGO", largura: "9%", alinhamento: "left" },
  { titulo: "DESCRIÇÃO DO PRODUTO/SERVIÇO", largura: "27%", alinhamento: "left" },
  { titulo: "NCM/SH", largura: "7%", alinhamento: "center" },
  { titulo: "CST", largura: "5%", alinhamento: "center" },
  { titulo: "CFOP", largura: "5%", alinhamento: "center" },
  { titulo: "UN", largura: "4%", alinhamento: "center" },
  { titulo: "QUANT", largura: "7%", alinhamento: "right" },
  { titulo: "VLR UNIT", largura: "8%", alinhamento: "right" },
  { titulo: "VLR TOTAL", largura: "8%", alinhamento: "right" },
  { titulo: "BC ICMS", largura: "6.5%", alinhamento: "right" },
  { titulo: "VLR ICMS", largura: "5.5%", alinhamento: "right" },
  { titulo: "VLR IPI", largura: "5%", alinhamento: "right" },
  { titulo: "ALÍQ ICMS", largura: "3.5%", alinhamento: "right" },
  { titulo: "ALÍQ IPI", largura: "3%", alinhamento: "right" },
]

function LinhaItem({ item, ultimo }: { item: ItemDanfe; ultimo: boolean }) {
  const valores = [
    item.codigo,
    item.descricao,
    item.ncm,
    item.cst,
    item.cfop,
    item.unidade,
    formatarQuantidade(item.quantidade),
    formatarMoeda(item.valorUnitario),
    formatarMoeda(item.valorTotal),
    formatarMoeda(item.baseIcms),
    formatarMoeda(item.valorIcms),
    item.valorIpi ? formatarMoeda(item.valorIpi) : "",
    item.aliquotaIcms ? formatarMoeda(item.aliquotaIcms) : "",
    item.aliquotaIpi ? formatarMoeda(item.aliquotaIpi) : "",
  ]

  return (
    <View style={[s.linha, ultimo ? {} : { borderBottomWidth: 0.4, borderColor: "#999999" }]}>
      {COLUNAS_ITENS.map((coluna, indice) => (
        <View
          key={coluna.titulo}
          style={[
            indice === COLUNAS_ITENS.length - 1 ? s.celulaFim : s.celula,
            s.celulaTabela,
            { width: coluna.largura },
          ]}
        >
          <Text style={{ textAlign: coluna.alinhamento }}>{valores[indice]}</Text>
        </View>
      ))}
    </View>
  )
}

export async function gerarPdfDanfe(dados: DadosDanfe): Promise<Buffer> {
  const codigoBarras = dados.chaveAcesso ? await gerarCodigoBarrasChave(dados.chaveAcesso) : null
  const { emitente, destinatario, totais, transporte, fatura } = dados

  const documento = (
    <Document title={`DANFE ${dados.numero}`}>
      <Page size="A4" style={s.pagina}>
        {/* 1. CANHOTO - recibo de entrega, destacavel no topo */}
        <View style={[s.quadro, { marginBottom: 4 }]}>
          <View style={s.linha}>
            <View style={[s.celula, { width: "80%" }]}>
              <Text style={s.canhotoTexto}>
                RECEBEMOS DE {emitente.nome} OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO
              </Text>
            </View>
            <View style={[s.celulaFim, { width: "20%" }]}>
              <Text style={s.valorForte}>NF-e</Text>
              <Text style={s.valor}>Nº {dados.numero}</Text>
              <Text style={s.valor}>SÉRIE {dados.serie}</Text>
            </View>
          </View>
          <View style={[s.linha, { borderTopWidth: 0.7, borderColor: PRETO }]}>
            <Campo rotulo="DATA DE RECEBIMENTO" valor="" largura="25%" />
            <Campo
              rotulo="IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR"
              valor=""
              largura="55%"
            />
            <View style={[s.celulaFim, { width: "20%" }]}>
              <Text style={s.rotulo}> </Text>
            </View>
          </View>
        </View>

        {/* 2. EMITENTE + DANFE + CHAVE DE ACESSO */}
        <View style={s.quadro}>
          <View style={s.linha}>
            <View style={[s.celula, { width: "40%", justifyContent: "center" }]}>
              <Text style={s.emitenteNome}>{emitente.nome}</Text>
              <Text style={{ textAlign: "center" }}>{enderecoLinha(emitente)}</Text>
              <Text style={{ textAlign: "center" }}>
                {[emitente.cidade, emitente.estado].filter(Boolean).join(" - ")}
                {emitente.cep ? ` - CEP ${formatarCep(emitente.cep)}` : ""}
              </Text>
              {emitente.telefone ? (
                <Text style={{ textAlign: "center" }}>Fone: {emitente.telefone}</Text>
              ) : null}
            </View>

            <View style={[s.celula, { width: "22%", justifyContent: "center" }]}>
              <Text style={s.danfeTitulo}>DANFE</Text>
              <Text style={s.danfeLegenda}>Documento Auxiliar da</Text>
              <Text style={s.danfeLegenda}>Nota Fiscal Eletrônica</Text>
              <Text style={[s.danfeLegenda, { marginTop: 3 }]}>
                {dados.tipoOperacao === "0" ? "0 - ENTRADA" : "1 - SAÍDA"}
              </Text>
              <Text style={[s.valorForte, { textAlign: "center", marginTop: 3 }]}>
                Nº {dados.numero}
              </Text>
              <Text style={[s.valor, { textAlign: "center" }]}>SÉRIE {dados.serie}</Text>
              <Text style={[s.valor, { textAlign: "center" }]}>FOLHA 1/1</Text>
            </View>

            <View style={[s.celulaFim, { width: "38%", justifyContent: "center" }]}>
              {codigoBarras ? (
                // Image aqui e do @react-pdf/renderer (desenha no PDF), nao a
                // <img> do HTML: nao tem prop alt.
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={codigoBarras} style={s.codigoBarras} />
              ) : null}
              <Text style={s.rotulo}>CHAVE DE ACESSO</Text>
              <Text style={s.chave}>{formatarChave(dados.chaveAcesso)}</Text>
              <Text style={[s.danfeLegenda, { marginTop: 2 }]}>
                Consulta de autenticidade no portal nacional da NF-e
                (www.nfe.fazenda.gov.br/portal) ou no site da Sefaz autorizadora
              </Text>
            </View>
          </View>

          {/* 3. NATUREZA DA OPERACAO / PROTOCOLO */}
          <View style={[s.linha, { borderTopWidth: 0.7, borderColor: PRETO }]}>
            <Campo rotulo="NATUREZA DA OPERAÇÃO" valor={dados.naturezaOperacao} largura="62%" />
            <Campo
              rotulo="PROTOCOLO DE AUTORIZAÇÃO DE USO"
              valor={dados.protocolo ?? "—"}
              largura="38%"
              ultimo
            />
          </View>

          <View style={[s.linha, { borderTopWidth: 0.7, borderColor: PRETO }]}>
            <Campo
              rotulo="INSCRIÇÃO ESTADUAL"
              valor={emitente.inscricaoEstadual ?? ""}
              largura="34%"
            />
            <Campo
              rotulo="INSC. ESTADUAL DO SUBST. TRIBUTÁRIO"
              valor={dados.inscricaoSubstitutoTributario ?? ""}
              largura="33%"
            />
            <Campo
              rotulo="CNPJ"
              valor={formatarDocumento(emitente.documento)}
              largura="33%"
              ultimo
            />
          </View>
        </View>

        {/* 4. DESTINATARIO / REMETENTE */}
        <Text style={s.tituloBloco}>DESTINATÁRIO / REMETENTE</Text>
        <View style={s.quadro}>
          <View style={s.linha}>
            <Campo rotulo="NOME/RAZÃO SOCIAL" valor={destinatario.nome} largura="58%" />
            <Campo
              rotulo="CNPJ/CPF"
              valor={formatarDocumento(destinatario.documento)}
              largura="24%"
            />
            <Campo
              rotulo="DATA DA EMISSÃO"
              valor={formatarData(dados.dataEmissao)}
              largura="18%"
              ultimo
            />
          </View>
          <View style={[s.linha, { borderTopWidth: 0.7, borderColor: PRETO }]}>
            <Campo rotulo="ENDEREÇO" valor={enderecoLinha(destinatario)} largura="46%" />
            <Campo rotulo="MUNICÍPIO" valor={destinatario.cidade ?? ""} largura="24%" />
            <Campo rotulo="UF" valor={destinatario.estado ?? ""} largura="7%" />
            <Campo
              rotulo="DATA DA SAÍDA/ENTRADA"
              valor={formatarData(dados.dataSaidaEntrada)}
              largura="23%"
              ultimo
            />
          </View>
          <View style={[s.linha, { borderTopWidth: 0.7, borderColor: PRETO }]}>
            <Campo rotulo="CEP" valor={formatarCep(destinatario.cep)} largura="20%" />
            <Campo rotulo="FONE/FAX" valor={destinatario.telefone ?? ""} largura="26%" />
            <Campo
              rotulo="INSCRIÇÃO ESTADUAL"
              valor={destinatario.inscricaoEstadual ?? ""}
              largura="31%"
            />
            <Campo rotulo="BAIRRO/DISTRITO" valor={destinatario.bairro ?? ""} largura="23%" ultimo />
          </View>
        </View>

        {/* 5. FATURA / DUPLICATAS - so quando a nota tem cobranca (grupo cobr
            do XML). Nota a vista nao tem esse quadro. */}
        {fatura && (
          <>
            <Text style={s.tituloBloco}>FATURA / DUPLICATAS</Text>
            <View style={s.quadro}>
              {fatura.numero && (
                <View style={s.linha}>
                  <Campo rotulo="NÚMERO" valor={fatura.numero} largura="25%" />
                  <Campo rotulo="VALOR ORIGINAL" valor={formatarMoeda(fatura.valorOriginal)} largura="25%" />
                  <Campo rotulo="VALOR DO DESCONTO" valor={formatarMoeda(fatura.valorDesconto)} largura="25%" />
                  <Campo
                    rotulo="VALOR LÍQUIDO"
                    valor={formatarMoeda(fatura.valorLiquido)}
                    largura="25%"
                    ultimo
                    forte
                  />
                </View>
              )}
              {fatura.duplicatas.length > 0 && (
                <View
                  style={[
                    s.linha,
                    { flexWrap: "wrap" },
                    fatura.numero ? { borderTopWidth: 0.7, borderColor: PRETO } : {},
                  ]}
                >
                  {/* As parcelas vao lado a lado, 4 por linha, que e como o
                      manual desenha - nota parcelada em 10x nao pode virar
                      uma coluna de 10 linhas comendo a pagina. */}
                  {fatura.duplicatas.map((duplicata, indice) => (
                    <View key={`${duplicata.numero}-${indice}`} style={[s.celula, { width: "25%" }]}>
                      <Text style={s.rotulo}>
                        PARCELA {duplicata.numero}
                        {duplicata.vencimento ? ` — VENC. ${formatarData(duplicata.vencimento)}` : ""}
                      </Text>
                      <Text style={s.valor}>{formatarMoeda(duplicata.valor)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* 6. CALCULO DO IMPOSTO */}
        <Text style={s.tituloBloco}>CÁLCULO DO IMPOSTO</Text>
        <View style={s.quadro}>
          <View style={s.linha}>
            <Campo rotulo="BASE DE CÁLCULO DO ICMS" valor={formatarMoeda(totais.baseIcms)} largura="20%" />
            <Campo rotulo="VALOR DO ICMS" valor={formatarMoeda(totais.valorIcms)} largura="20%" />
            <Campo rotulo="BASE DE CÁLCULO DO ICMS ST" valor={formatarMoeda(totais.baseIcmsSt)} largura="20%" />
            <Campo rotulo="VALOR DO ICMS ST" valor={formatarMoeda(totais.valorIcmsSt)} largura="20%" />
            <Campo
              rotulo="VALOR TOTAL DOS PRODUTOS"
              valor={formatarMoeda(totais.valorProdutos)}
              largura="20%"
              ultimo
            />
          </View>
          <View style={[s.linha, { borderTopWidth: 0.7, borderColor: PRETO }]}>
            <Campo rotulo="VALOR DO FRETE" valor={formatarMoeda(totais.valorFrete)} largura="14%" />
            <Campo rotulo="VALOR DO SEGURO" valor={formatarMoeda(totais.valorSeguro)} largura="14%" />
            <Campo rotulo="DESCONTO" valor={formatarMoeda(totais.valorDesconto)} largura="14%" />
            <Campo rotulo="OUTRAS DESPESAS" valor={formatarMoeda(totais.valorOutros)} largura="14%" />
            <Campo rotulo="VALOR DO IPI" valor={formatarMoeda(totais.valorIpi)} largura="14%" />
            {/* Valor aproximado dos tributos (Lei 12.741/2012). Fica em
                branco quando o XML nao informa: imprimir 0,00 diria que a
                nota nao tem tributo nenhum, que e diferente de "nao informado". */}
            <Campo
              rotulo="V. APROX. TRIBUTOS"
              valor={
                totais.valorAproximadoTributos ? formatarMoeda(totais.valorAproximadoTributos) : ""
              }
              largura="14%"
            />
            <Campo
              rotulo="VALOR TOTAL DA NOTA"
              valor={formatarMoeda(totais.valorTotal)}
              largura="16%"
              ultimo
              forte
            />
          </View>
        </View>

        {/* 6. TRANSPORTADOR / VOLUMES */}
        <Text style={s.tituloBloco}>TRANSPORTADOR / VOLUMES TRANSPORTADOS</Text>
        <View style={s.quadro}>
          <View style={s.linha}>
            <Campo
              rotulo="NOME/RAZÃO SOCIAL"
              valor={transporte.transportadora ?? ""}
              largura="42%"
            />
            <Campo
              rotulo="FRETE POR CONTA"
              valor={MODALIDADES_FRETE[transporte.modalidadeFrete] ?? transporte.modalidadeFrete}
              largura="20%"
            />
            <Campo rotulo="UF" valor={transporte.ufTransportadora ?? ""} largura="8%" />
            <Campo
              rotulo="CNPJ/CPF"
              valor={
                transporte.documentoTransportadora
                  ? formatarDocumento(transporte.documentoTransportadora)
                  : ""
              }
              largura="30%"
              ultimo
            />
          </View>
          <View style={[s.linha, { borderTopWidth: 0.7, borderColor: PRETO }]}>
            <Campo rotulo="QUANTIDADE" valor={transporte.quantidadeVolumes ?? ""} largura="25%" />
            <Campo rotulo="ESPÉCIE" valor={transporte.especie ?? ""} largura="25%" />
            <Campo rotulo="PESO BRUTO" valor={transporte.pesoBruto ?? ""} largura="25%" />
            <Campo rotulo="PESO LÍQUIDO" valor={transporte.pesoLiquido ?? ""} largura="25%" ultimo />
          </View>
        </View>

        {/* 7. DADOS DO PRODUTO / SERVICO */}
        <Text style={s.tituloBloco}>DADOS DO PRODUTO / SERVIÇO</Text>
        <View style={s.quadro}>
          <View style={[s.linha, { borderBottomWidth: 0.7, borderColor: PRETO }]}>
            {COLUNAS_ITENS.map((coluna, indice) => (
              <View
                key={coluna.titulo}
                style={[
                  indice === COLUNAS_ITENS.length - 1 ? s.celulaFim : s.celula,
                  s.celulaTabela,
                  { width: coluna.largura },
                ]}
              >
                <Text style={s.cabecalhoTabela}>{coluna.titulo}</Text>
              </View>
            ))}
          </View>
          {dados.itens.map((item, indice) => (
            <LinhaItem
              key={`${item.codigo}-${indice}`}
              item={item}
              ultimo={indice === dados.itens.length - 1}
            />
          ))}
        </View>

        {/* 8. DADOS ADICIONAIS */}
        <Text style={s.tituloBloco}>DADOS ADICIONAIS</Text>
        <View style={[s.quadro, { minHeight: 46 }]}>
          <View style={s.linha}>
            <View style={[s.celula, { width: "65%" }]}>
              <Text style={s.rotulo}>INFORMAÇÕES COMPLEMENTARES</Text>
              <Text style={{ fontSize: 5.5 }}>{dados.informacoesComplementares ?? ""}</Text>
            </View>
            <View style={[s.celulaFim, { width: "35%" }]}>
              <Text style={s.rotulo}>RESERVADO AO FISCO</Text>
              <Text style={{ fontSize: 5.5 }}>{dados.informacoesFisco ?? ""}</Text>
            </View>
          </View>
        </View>

        {/* Assinatura do software que gerou a representacao grafica - todo
            emissor faz isso, e e o que identifica de onde saiu o papel quando
            alguem cruza dois DANFEs da mesma nota. */}
        <Text style={s.assinaturaSistema}>
          {NOME_SISTEMA} — {FABRICANTE_SISTEMA}
        </Text>

        {/* Duas situacoes diferentes levam ao mesmo aviso. A de homologacao e
            a mais traicoeira: a nota FOI autorizada e tem protocolo, entao sem
            este carimbo o papel sai identico ao de uma nota real e alguem
            acaba mandando um teste junto com a mercadoria. */}
        {dados.ambiente === "2" ? (
          <View style={[s.quadro, { marginTop: 4 }]}>
            <Text style={s.semValorFiscal}>
              SEM VALOR FISCAL — NF-E EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO
            </Text>
          </View>
        ) : dados.protocolo ? null : (
          <View style={[s.quadro, { marginTop: 4 }]}>
            <Text style={s.semValorFiscal}>
              SEM VALOR FISCAL — XML sem protocolo de autorização
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )

  return renderToBuffer(documento)
}
