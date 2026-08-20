import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { parseNfeParaDanfe } from "@/lib/nfe-xml"
import { gerarPdfDanfe } from "@/lib/pdf-danfe"
import { garantirXmlNotaSaida } from "@/lib/notas-fiscais"
import { NextResponse } from "next/server"
import JSZip from "jszip"

// Lote de notas pro contador, com ENTRADA e SAIDA no mesmo .zip - e o que o
// cliente entrega no fim do mes. A exportacao que ja existia em Compras cobre
// so a entrada; esta aqui e a da tela de Notas Fiscais e fecha o mes inteiro.
//
// O periodo e sempre por DATA DE EMISSAO: e por competencia que o contador
// fecha o mes (nota emitida em 30/06 e lancada em 02/07 pertence a junho).
//
// Os arquivos vao em pastas separadas dentro do zip ("entradas/" e "saidas/"),
// porque e assim que o contador organiza na hora de importar - misturar os
// dois num diretorio so obriga ele a separar na mao.

// Cada DANFE e um PDF renderizado na hora. Um periodo grande com PDF ligado
// poderia segurar o processo por minutos - o teto corta antes disso. O XML
// sozinho e leve e nao precisa de limite.
const MAXIMO_DANFES_POR_EXPORTACAO = 150

// Buscar XML no Bling e uma chamada de rede por nota. Num mes com muita venda
// isso passaria do tempo limite da requisicao, entao a exportacao completa o
// que faltar ate esse teto e avisa quantas ficaram - o operador roda de novo
// e o resto vem, ja que cada uma fica guardada.
const MAXIMO_XMLS_BAIXADOS_POR_EXPORTACAO = 40

type ArquivoExportado = { nome: string; conteudo: string; tipo: "xml" | "pdf" }

function nomeArquivo(chave: string | null, numero: string | null, extensao: "xml" | "pdf") {
  if (chave) return `${chave}.${extensao}`
  if (numero) return `nota-${numero.replace(/\W/g, "")}.${extensao}`
  return `nota-sem-identificacao.${extensao}`
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const {
    inicio,
    fim,
    tipo = "ambos",
    incluir = "xml",
    fornecedorId = null,
    marca = null,
  }: {
    inicio: string
    fim: string
    tipo?: "entrada" | "saida" | "ambos"
    incluir?: "xml" | "pdf" | "ambos"
    fornecedorId?: string | null
    marca?: string | null
  } = await request.json()

  if (!inicio || !fim) {
    return NextResponse.json({ erro: "Informe o período de emissão" }, { status: 400 })
  }

  const notas: { pasta: string; chave: string | null; numero: string | null; xml: string }[] = []

  if (tipo !== "saida") {
    const condicoes = ["c.xml_nfe IS NOT NULL", "c.data_emissao BETWEEN $1 AND $2", "c.status <> 'cancelada'"]
    const parametros: unknown[] = [inicio, fim]
    if (fornecedorId) {
      parametros.push(fornecedorId)
      condicoes.push(`c.fornecedor_id = $${parametros.length}`)
    }

    const entradas = await query(
      `SELECT c.chave_acesso, c.numero_nota, c.xml_nfe
       FROM TAB_COMPRA c
       WHERE ${condicoes.join(" AND ")}
       ORDER BY c.data_emissao`,
      parametros
    )

    for (const entrada of entradas) {
      notas.push({
        pasta: "entradas",
        chave: entrada.chave_acesso,
        numero: entrada.numero_nota,
        xml: entrada.xml_nfe,
      })
    }
  }

  let saidasSemXml = 0

  if (tipo !== "entrada") {
    // Filtro por marca so existe na saida: entrada e do CNPJ, nao da vitrine.
    const condicoes = [
      "p.bling_nota_id IS NOT NULL",
      "p.bling_nota_cancelada_em IS NULL",
      // Nota cujo XML ainda nao foi baixado nao tem data de emissao gravada -
      // nesses casos vale a data do pedido, senao ela sumiria do lote
      // justamente por nunca ter sido aberta.
      "COALESCE(p.nfe_data_emissao, p.criado_em::date) BETWEEN $1 AND $2",
    ]
    const parametros: unknown[] = [inicio, fim]
    if (marca) {
      parametros.push(marca)
      condicoes.push(`p.marca = $${parametros.length}`)
    }

    const saidas = await query(
      `SELECT p.id, p.nfe_chave_acesso, p.nfe_numero, p.xml_nfe
       FROM TAB_PEDIDO p
       WHERE ${condicoes.join(" AND ")}
       ORDER BY COALESCE(p.nfe_data_emissao, p.criado_em::date)`,
      parametros
    )

    let baixados = 0
    for (const saida of saidas) {
      let xml: string | null = saida.xml_nfe

      if (!xml) {
        if (baixados >= MAXIMO_XMLS_BAIXADOS_POR_EXPORTACAO) {
          saidasSemXml++
          continue
        }
        baixados++
        // Uma nota que o Bling nao devolve nao pode derrubar o lote inteiro.
        xml = await garantirXmlNotaSaida(saida.id).catch(() => null)
        if (!xml) {
          saidasSemXml++
          continue
        }
      }

      const chave = saida.nfe_chave_acesso ?? xml.match(/Id="NFe(\d{44})"/)?.[1] ?? null
      notas.push({ pasta: "saidas", chave, numero: saida.nfe_numero, xml })
    }
  }

  if (notas.length === 0) {
    return NextResponse.json(
      { erro: "Nenhuma nota com XML guardado nesse período." },
      { status: 404 }
    )
  }

  const querPdf = incluir === "pdf" || incluir === "ambos"
  if (querPdf && notas.length > MAXIMO_DANFES_POR_EXPORTACAO) {
    return NextResponse.json(
      {
        erro: `Esse período tem ${notas.length} notas e o DANFE é gerado uma a uma. Exporte só o XML (que é o que o contador precisa) ou divida em períodos menores.`,
      },
      { status: 400 }
    )
  }

  const arquivos: ArquivoExportado[] = []
  for (const nota of notas) {
    if (incluir === "xml" || incluir === "ambos") {
      arquivos.push({
        nome: `${nota.pasta}/${nomeArquivo(nota.chave, nota.numero, "xml")}`,
        conteudo: nota.xml,
        tipo: "xml",
      })
    }
    if (querPdf) {
      // XML corrompido nao derruba o lote - o resto continua exportavel.
      try {
        const pdf = await gerarPdfDanfe(parseNfeParaDanfe(nota.xml))
        arquivos.push({
          nome: `${nota.pasta}/${nomeArquivo(nota.chave, nota.numero, "pdf")}`,
          conteudo: pdf.toString("base64"),
          tipo: "pdf",
        })
      } catch {
        continue
      }
    }
  }

  const zip = new JSZip()
  for (const arquivo of arquivos) {
    zip.file(arquivo.nome, arquivo.conteudo, arquivo.tipo === "pdf" ? { base64: true } : undefined)
  }
  const conteudoZip = await zip.generateAsync({ type: "nodebuffer" })

  return new NextResponse(new Uint8Array(conteudoZip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="notas-fiscais-${inicio}-a-${fim}.zip"`,
      // A tela usa isso pra avisar que faltou nota, sem precisar de outra
      // requisicao: o corpo da resposta e o proprio arquivo.
      "X-Notas-Sem-Xml": String(saidasSemXml),
      "X-Notas-Exportadas": String(notas.length),
    },
  })
}
