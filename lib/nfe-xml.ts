import { XMLParser } from "fast-xml-parser"
import { validarChaveAcesso } from "@/lib/chave-acesso"

// Le e valida XML de NF-e de ENTRADA (nota que o fornecedor emitiu e ja
// autorizou na Sefaz) - so leitura, nunca assinatura/emissao, por isso nao
// precisa de certificado digital nenhum (diferente da NF-e de venda, que
// fica 100% com o Bling).

export type ItemNfeXml = {
  codigoFornecedor: string
  codigoBarras: string | null
  descricao: string
  ncm: string | null
  quantidade: number
  valorUnitario: number
}

export type DadosNfeXml = {
  chaveAcesso: string | null
  chaveValida: boolean
  numero: string | null
  serie: string | null
  dataEmissao: string | null
  emitente: {
    cnpj: string
    razaoSocial: string
    nomeFantasia: string | null
    telefone: string | null
    cep: string | null
    logradouro: string | null
    numero: string | null
    bairro: string | null
    cidade: string | null
    estado: string | null
  }
  itens: ItemNfeXml[]
  valorFrete: number
  valorTotal: number
}

// Alguns campos viram objeto quando so ha 1 ocorrencia e array quando ha
// varias (comportamento padrao de parser XML) - normaliza pra sempre array.
function paraArray<T>(valor: T | T[] | undefined): T[] {
  if (valor === undefined) return []
  return Array.isArray(valor) ? valor : [valor]
}

export function parseNfeXml(xmlTexto: string): DadosNfeXml {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- estrutura vem do parser de XML, formato varia por nota
  let doc: any
  try {
    doc = parser.parse(xmlTexto)
  } catch {
    throw new Error("Arquivo XML inválido ou corrompido")
  }

  const infNFe = doc?.nfeProc?.NFe?.infNFe ?? doc?.NFe?.infNFe
  if (!infNFe) {
    throw new Error("Este arquivo não parece ser uma NF-e válida (tag infNFe não encontrada)")
  }

  const idAttr: string | undefined = infNFe["@_Id"]
  const chaveAcesso = idAttr ? idAttr.replace(/^NFe/, "") : null
  const chaveValida = chaveAcesso ? validarChaveAcesso(chaveAcesso) : false

  const ide = infNFe.ide ?? {}
  const emit = infNFe.emit ?? {}
  const enderEmit = emit.enderEmit ?? {}
  const total = infNFe.total?.ICMSTot ?? {}

  const detalhes = paraArray(infNFe.det)
  if (detalhes.length === 0) {
    throw new Error("XML não tem nenhum item de produto (tag det)")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- estrutura vem do parser de XML, formato varia por nota
  const itens: ItemNfeXml[] = detalhes.map((det: any) => {
    const prod = det.prod ?? {}
    // cEAN vem como "SEM GTIN" quando o produto nao tem codigo de barras -
    // nesse caso tratamos como ausente, nao como um codigo de verdade.
    const ean = String(prod.cEAN ?? "")
    return {
      codigoFornecedor: String(prod.cProd ?? ""),
      codigoBarras: ean && ean.toUpperCase() !== "SEM GTIN" ? ean : null,
      descricao: String(prod.xProd ?? ""),
      ncm: prod.NCM ? String(prod.NCM) : null,
      quantidade: Number(prod.qCom) || 0,
      valorUnitario: Number(prod.vUnCom) || 0,
    }
  })

  return {
    chaveAcesso,
    chaveValida,
    numero: ide.nNF ? String(ide.nNF) : null,
    serie: ide.serie ? String(ide.serie) : null,
    dataEmissao: ide.dhEmi ? String(ide.dhEmi).slice(0, 10) : null,
    emitente: {
      cnpj: String(emit.CNPJ ?? "").replace(/\D/g, ""),
      razaoSocial: String(emit.xNome ?? "Fornecedor"),
      nomeFantasia: emit.xFant ? String(emit.xFant) : null,
      telefone: emit.fone ? String(emit.fone) : null,
      cep: enderEmit.CEP ? String(enderEmit.CEP) : null,
      logradouro: enderEmit.xLgr ? String(enderEmit.xLgr) : null,
      numero: enderEmit.nro ? String(enderEmit.nro) : null,
      bairro: enderEmit.xBairro ? String(enderEmit.xBairro) : null,
      cidade: enderEmit.xMun ? String(enderEmit.xMun) : null,
      estado: enderEmit.UF ? String(enderEmit.UF) : null,
    },
    itens,
    valorFrete: Number(total.vFrete) || 0,
    valorTotal: Number(total.vNF) || 0,
  }
}

// ============================================================
// DADOS PARA O DANFE
// O parse acima extrai so o que a IMPORTACAO precisa (fornecedor, itens,
// total). O DANFE precisa da nota inteira: destinatario, impostos, CFOP e
// CST por item, transportador, volumes, protocolo de autorizacao. Fica numa
// funcao separada de proposito - assim a importacao, que e o caminho
// critico, nao passa a depender de campos que so a impressao usa.
// ============================================================

export type ItemDanfe = {
  codigo: string
  descricao: string
  ncm: string
  cst: string
  cfop: string
  unidade: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  baseIcms: number
  valorIcms: number
  aliquotaIcms: number
  valorIpi: number
  aliquotaIpi: number
}

export type DadosDanfe = {
  chaveAcesso: string | null
  numero: string
  serie: string
  naturezaOperacao: string
  // tpNF: 0 = entrada, 1 = saida. Vai impresso no quadrinho do cabecalho.
  tipoOperacao: "0" | "1"
  dataEmissao: string | null
  dataSaidaEntrada: string | null
  protocolo: string | null
  emitente: ParticipanteDanfe
  destinatario: ParticipanteDanfe
  itens: ItemDanfe[]
  totais: {
    baseIcms: number
    valorIcms: number
    baseIcmsSt: number
    valorIcmsSt: number
    valorProdutos: number
    valorFrete: number
    valorSeguro: number
    valorDesconto: number
    valorIpi: number
    valorOutros: number
    valorTotal: number
    // vTotTrib: valor aproximado dos tributos (Lei 12.741/2012). Nao entra em
    // conta nenhuma - e informativo e o DANFE e obrigado a mostrar.
    valorAproximadoTributos: number
  }
  // Quadro FATURA/DUPLICATAS: sai do grupo cobr do XML. Nota a vista nao tem
  // esse grupo, e ai o quadro simplesmente nao e impresso.
  fatura: {
    numero: string | null
    valorOriginal: number
    valorDesconto: number
    valorLiquido: number
    duplicatas: { numero: string; vencimento: string | null; valor: number }[]
  } | null
  transporte: {
    modalidadeFrete: string
    transportadora: string | null
    documentoTransportadora: string | null
    ufTransportadora: string | null
    quantidadeVolumes: string | null
    especie: string | null
    pesoBruto: string | null
    pesoLiquido: string | null
  }
  informacoesComplementares: string | null
  // Area "RESERVADO AO FISCO" do quadro de dados adicionais - texto que o
  // emitente e obrigado a colocar em alguns casos (beneficio fiscal etc).
  informacoesFisco: string | null
  // Inscricao estadual do substituto tributario: quadro proprio no cabecalho
  // do DANFE, preenchido quando o emitente e substituto em outra UF.
  inscricaoSubstitutoTributario: string | null
}

export type ParticipanteDanfe = {
  nome: string
  documento: string
  inscricaoEstadual: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  telefone: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- estrutura vem do parser de XML, formato varia por nota
function montarParticipante(no: any, tagEndereco: string): ParticipanteDanfe {
  const endereco = no?.[tagEndereco] ?? {}
  const texto = (valor: unknown) => (valor === undefined || valor === null ? null : String(valor))

  return {
    nome: String(no?.xNome ?? ""),
    // Pessoa juridica tem CNPJ, fisica tem CPF - so uma das duas tags existe.
    documento: String(no?.CNPJ ?? no?.CPF ?? ""),
    inscricaoEstadual: texto(no?.IE),
    logradouro: texto(endereco.xLgr),
    numero: texto(endereco.nro),
    bairro: texto(endereco.xBairro),
    cidade: texto(endereco.xMun),
    estado: texto(endereco.UF),
    cep: texto(endereco.CEP),
    telefone: texto(endereco.fone ?? no?.fone),
  }
}

// Grupo cobr do XML: fat (a fatura) e dup (as parcelas). Os dois sao
// opcionais e independentes - existe nota com duplicatas e sem cabecalho de
// fatura, e vice-versa. Sem nenhum dos dois, devolve null e o quadro nao e
// impresso (nota a vista).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- estrutura vem do parser de XML, formato varia por nota
function montarFatura(cobr: any): DadosDanfe["fatura"] {
  if (!cobr) return null

  const fat = cobr.fat ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- estrutura vem do parser de XML, formato varia por nota
  const duplicatas = paraArray<any>(cobr.dup).map((dup, indice) => ({
    // O parser de XML converte "001" pro numero 1 - a numeracao de parcela e
    // escrita com 3 digitos em todo emissor, entao devolve o zero a esquerda.
    numero: dup?.nDup !== undefined ? String(dup.nDup).padStart(3, "0") : String(indice + 1).padStart(3, "0"),
    vencimento: dup?.dVenc ? String(dup.dVenc).slice(0, 10) : null,
    valor: Number(dup?.vDup) || 0,
  }))

  if (fat.nFat === undefined && duplicatas.length === 0) return null

  return {
    numero: fat.nFat !== undefined ? String(fat.nFat) : null,
    valorOriginal: Number(fat.vOrig) || 0,
    valorDesconto: Number(fat.vDesc) || 0,
    valorLiquido: Number(fat.vLiq) || 0,
    duplicatas,
  }
}

export function parseNfeParaDanfe(xmlTexto: string): DadosDanfe {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- estrutura vem do parser de XML, formato varia por nota
  let doc: any
  try {
    doc = parser.parse(xmlTexto)
  } catch {
    throw new Error("Arquivo XML inválido ou corrompido")
  }

  const infNFe = doc?.nfeProc?.NFe?.infNFe ?? doc?.NFe?.infNFe
  if (!infNFe) {
    throw new Error("Este arquivo não parece ser uma NF-e válida (tag infNFe não encontrada)")
  }

  const ide = infNFe.ide ?? {}
  const total = infNFe.total?.ICMSTot ?? {}
  const transp = infNFe.transp ?? {}
  const volume = paraArray(transp.vol)[0] ?? {}
  const idAttr: string | undefined = infNFe["@_Id"]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- estrutura vem do parser de XML, formato varia por nota
  const itens: ItemDanfe[] = paraArray(infNFe.det).map((det: any) => {
    const prod = det.prod ?? {}
    // O grupo de ICMS vem com o nome da situacao tributaria (ICMS00, ICMS60,
    // ICMSSN102...), que muda por regime e por CST - pega o primeiro filho,
    // qualquer que seja o nome.
    const grupoIcms = Object.values(det.imposto?.ICMS ?? {})[0] as Record<string, unknown> | undefined
    const ipi = (det.imposto?.IPI?.IPITrib ?? {}) as Record<string, unknown>

    // Empresa do Simples usa CSOSN no lugar do CST - o DANFE imprime os dois
    // na mesma coluna, junto da origem da mercadoria.
    const origem = grupoIcms?.orig !== undefined ? String(grupoIcms.orig) : ""
    const situacao = grupoIcms?.CST ?? grupoIcms?.CSOSN
    const cst = situacao !== undefined ? `${origem}${String(situacao)}` : origem

    return {
      codigo: String(prod.cProd ?? ""),
      descricao: String(prod.xProd ?? ""),
      ncm: prod.NCM ? String(prod.NCM) : "",
      cst,
      cfop: prod.CFOP ? String(prod.CFOP) : "",
      unidade: prod.uCom ? String(prod.uCom) : "",
      quantidade: Number(prod.qCom) || 0,
      valorUnitario: Number(prod.vUnCom) || 0,
      valorTotal: Number(prod.vProd) || 0,
      baseIcms: Number(grupoIcms?.vBC) || 0,
      valorIcms: Number(grupoIcms?.vICMS) || 0,
      aliquotaIcms: Number(grupoIcms?.pICMS) || 0,
      valorIpi: Number(ipi.vIPI) || 0,
      aliquotaIpi: Number(ipi.pIPI) || 0,
    }
  })

  return {
    chaveAcesso: idAttr ? idAttr.replace(/^NFe/, "") : null,
    numero: ide.nNF ? String(ide.nNF) : "",
    serie: ide.serie ? String(ide.serie) : "",
    naturezaOperacao: String(ide.natOp ?? ""),
    tipoOperacao: String(ide.tpNF ?? "1") === "0" ? "0" : "1",
    dataEmissao: ide.dhEmi ? String(ide.dhEmi).slice(0, 10) : null,
    dataSaidaEntrada: ide.dhSaiEnt ? String(ide.dhSaiEnt).slice(0, 10) : null,
    // Protocolo so existe em XML processado (nfeProc) - o XML "cru", antes da
    // autorizacao, nao tem. Sem protocolo o DANFE nao vale como documento.
    protocolo: doc?.nfeProc?.protNFe?.infProt?.nProt
      ? String(doc.nfeProc.protNFe.infProt.nProt)
      : null,
    emitente: montarParticipante(infNFe.emit, "enderEmit"),
    destinatario: montarParticipante(infNFe.dest, "enderDest"),
    itens,
    totais: {
      baseIcms: Number(total.vBC) || 0,
      valorIcms: Number(total.vICMS) || 0,
      baseIcmsSt: Number(total.vBCST) || 0,
      valorIcmsSt: Number(total.vST) || 0,
      valorProdutos: Number(total.vProd) || 0,
      valorFrete: Number(total.vFrete) || 0,
      valorSeguro: Number(total.vSeg) || 0,
      valorDesconto: Number(total.vDesc) || 0,
      valorIpi: Number(total.vIPI) || 0,
      valorOutros: Number(total.vOutro) || 0,
      valorTotal: Number(total.vNF) || 0,
      valorAproximadoTributos: Number(total.vTotTrib) || 0,
    },
    fatura: montarFatura(infNFe.cobr),
    transporte: {
      modalidadeFrete: String(transp.modFrete ?? "9"),
      transportadora: transp.transporta?.xNome ? String(transp.transporta.xNome) : null,
      documentoTransportadora: transp.transporta?.CNPJ
        ? String(transp.transporta.CNPJ)
        : transp.transporta?.CPF
          ? String(transp.transporta.CPF)
          : null,
      ufTransportadora: transp.transporta?.UF ? String(transp.transporta.UF) : null,
      quantidadeVolumes: volume.qVol !== undefined ? String(volume.qVol) : null,
      especie: volume.esp !== undefined ? String(volume.esp) : null,
      pesoBruto: volume.pesoB !== undefined ? String(volume.pesoB) : null,
      pesoLiquido: volume.pesoL !== undefined ? String(volume.pesoL) : null,
    },
    informacoesComplementares: infNFe.infAdic?.infCpl ? String(infNFe.infAdic.infCpl) : null,
    informacoesFisco: infNFe.infAdic?.infAdFisco ? String(infNFe.infAdic.infAdFisco) : null,
    inscricaoSubstitutoTributario: infNFe.emit?.IEST ? String(infNFe.emit.IEST) : null,
  }
}
