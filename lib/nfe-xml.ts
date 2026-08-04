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
    throw new Error("Arquivo XML invalido ou corrompido")
  }

  const infNFe = doc?.nfeProc?.NFe?.infNFe ?? doc?.NFe?.infNFe
  if (!infNFe) {
    throw new Error("Este arquivo nao parece ser uma NF-e valida (tag infNFe nao encontrada)")
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
    throw new Error("XML nao tem nenhum item de produto (tag det)")
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
