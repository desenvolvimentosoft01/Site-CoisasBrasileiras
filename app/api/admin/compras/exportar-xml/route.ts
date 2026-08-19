import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { parseNfeParaDanfe } from "@/lib/nfe-xml"
import { gerarPdfDanfe } from "@/lib/pdf-danfe"
import { NextResponse } from "next/server"
import JSZip from "jszip"

// Exporta os XMLs das notas de entrada de um periodo - e o lote que o
// contador pede todo mes pra fechar o SPED. Antes o operador tinha que
// caçar arquivo no e-mail; agora sai do proprio sistema.
//
// Dois formatos, porque a tela oferece as duas formas de salvar:
//   - "zip"   -> um arquivo so, download normal do navegador.
//   - "lista" -> JSON com o conteudo de cada arquivo, pra tela gravar arquivo
//                por arquivo dentro da pasta que o operador escolher.
//
// E tres conteudos: so o XML (o que tem valor fiscal), so o DANFE em PDF (o
// que o cliente le e imprime) ou os dois.
//
// O periodo pode ser filtrado por DATA DE EMISSAO (competencia da nota, que e
// como o contador fecha o mes - nota emitida em 30/06 e lancada em 02/07
// pertence a junho) ou por DATA DA COMPRA (quando foi lancada aqui), porque
// nem sempre a busca do operador e a do contador. Os demais filtros
// (fornecedor, status, numero) existem pra dar conta do caso "preciso so das
// notas daquele fornecedor".
//
// Nota antiga, lancada antes desta funcionalidade existir, nao tem XML
// guardado e por isso fica de fora - a consulta filtra por "xml_nfe IS NOT
// NULL".

type FiltrosExport = {
  inicio: string
  fim: string
  campoData: "emissao" | "compra"
  fornecedorId: string | null
  status: string | null
  numeroNota: string | null
}

// O "conteudo" e string pro XML e base64 pro PDF - o formato "lista" vai por
// JSON, que nao carrega binario. A tela decodifica o base64 antes de gravar.
type ArquivoExportado = {
  nome: string
  conteudo: string
  tipo: "xml" | "pdf"
}

type NotaExportada = {
  nome: string
  xml: string
  chaveAcesso: string | null
  numeroNota: string | null
}

// A chave de acesso e o nome de arquivo padrao de mercado pra XML de NF-e
// (e o que os sistemas contabeis esperam na importacao em lote). Nota antiga
// sem chave cai pro numero, so pra nao gerar arquivo sem nome.
function montarNomeArquivo(
  chaveAcesso: string | null,
  numeroNota: string | null,
  extensao: "xml" | "pdf"
): string {
  if (chaveAcesso) return `${chaveAcesso}.${extensao}`
  if (numeroNota) return `nota-${numeroNota.replace(/\W/g, "")}.${extensao}`
  return `nota-sem-identificacao.${extensao}`
}

// Monta a lista final de arquivos conforme o operador pediu XML, PDF ou os
// dois. O DANFE e gerado na hora a partir do XML guardado - nao existe PDF
// pronto no banco, so o XML (que e o que tem valor fiscal).
async function montarArquivos(
  notas: NotaExportada[],
  incluir: "xml" | "pdf" | "ambos"
): Promise<ArquivoExportado[]> {
  const arquivos: ArquivoExportado[] = []

  for (const nota of notas) {
    if (incluir === "xml" || incluir === "ambos") {
      arquivos.push({
        nome: montarNomeArquivo(nota.chaveAcesso, nota.numeroNota, "xml"),
        conteudo: nota.xml,
        tipo: "xml",
      })
    }

    if (incluir === "pdf" || incluir === "ambos") {
      // Uma nota com XML corrompido nao pode derrubar o lote inteiro - o
      // resto do periodo continua exportavel, e o operador percebe a falta
      // pelo numero de arquivos.
      try {
        const pdf = await gerarPdfDanfe(parseNfeParaDanfe(nota.xml))
        arquivos.push({
          nome: montarNomeArquivo(nota.chaveAcesso, nota.numeroNota, "pdf"),
          conteudo: pdf.toString("base64"),
          tipo: "pdf",
        })
      } catch {
        continue
      }
    }
  }

  return arquivos
}

async function buscarNotasDoPeriodo(filtros: FiltrosExport): Promise<NotaExportada[]> {
  // Coluna de data escolhida pelo filtro. Nunca vem do usuario direto: e um
  // de dois valores fixos, resolvido aqui - interpolar entrada do usuario em
  // SQL abriria injection.
  const colunaData = filtros.campoData === "compra" ? "data_compra" : "data_emissao"

  const condicoes = [
    "xml_nfe IS NOT NULL",
    `${colunaData} BETWEEN $1 AND $2`,
  ]
  const parametros: unknown[] = [filtros.inicio, filtros.fim]

  // Cancelada fica de fora sempre que o operador nao pediu um status
  // especifico - nota cancelada no lote do contador so gera confusao.
  if (filtros.status) {
    parametros.push(filtros.status)
    condicoes.push(`status = $${parametros.length}`)
  } else {
    condicoes.push("status <> 'cancelada'")
  }

  if (filtros.fornecedorId) {
    parametros.push(filtros.fornecedorId)
    condicoes.push(`fornecedor_id = $${parametros.length}`)
  }

  if (filtros.numeroNota) {
    parametros.push(`%${filtros.numeroNota}%`)
    condicoes.push(`numero_nota ILIKE $${parametros.length}`)
  }

  const notas = await query(
    `SELECT chave_acesso, numero_nota, xml_nfe
       FROM TAB_COMPRA
      WHERE ${condicoes.join(" AND ")}
      ORDER BY ${colunaData}, numero_nota`,
    parametros
  )

  return notas.map((nota) => ({
    nome: montarNomeArquivo(nota.chave_acesso, nota.numero_nota, "xml"),
    xml: nota.xml_nfe,
    chaveAcesso: nota.chave_acesso,
    numeroNota: nota.numero_nota,
  }))
}

export async function GET(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { searchParams } = new URL(request.url)
  const inicio = searchParams.get("inicio")
  const fim = searchParams.get("fim")
  const formato = searchParams.get("formato") === "lista" ? "lista" : "zip"
  const campoData = searchParams.get("campoData") === "compra" ? "compra" : "emissao"
  const incluirParam = searchParams.get("incluir")
  const incluir = incluirParam === "pdf" || incluirParam === "ambos" ? incluirParam : "xml"
  const status = searchParams.get("status")
  const statusValido = status === "pendente" || status === "recebida" || status === "cancelada"

  if (!inicio || !fim) {
    return NextResponse.json({ erro: "Informe o período (data inicial e final)" }, { status: 400 })
  }
  if (inicio > fim) {
    return NextResponse.json({ erro: "A data inicial não pode ser maior que a final" }, { status: 400 })
  }

  const notas = await buscarNotasDoPeriodo({
    inicio,
    fim,
    campoData,
    fornecedorId: searchParams.get("fornecedorId") || null,
    status: statusValido ? status : null,
    numeroNota: searchParams.get("numeroNota") || null,
  })

  if (notas.length === 0) {
    return NextResponse.json(
      { erro: "Nenhuma nota com XML guardado para esses filtros" },
      { status: 404 }
    )
  }

  const arquivos = await montarArquivos(notas, incluir)

  if (formato === "lista") {
    return NextResponse.json({ arquivos })
  }

  const zip = new JSZip()
  for (const arquivo of arquivos) {
    zip.file(arquivo.nome, arquivo.conteudo, arquivo.tipo === "pdf" ? { base64: true } : {})
  }
  // DEFLATE: XML e texto e comprime muito bem (um lote de dezenas de notas
  // cai pra uma fracao do tamanho), o que importa no download de um mes
  // inteiro.
  const conteudo = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })

  return new NextResponse(Buffer.from(conteudo), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="notas-entrada-${inicio}-a-${fim}.zip"`,
    },
  })
}
