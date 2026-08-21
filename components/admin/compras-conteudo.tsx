"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  PackageCheck,
  Ban,
  FileUp,
  Radio,
  RefreshCw,
  Link2,
  ClipboardList,
  FolderDown,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { CampoDica } from "@/components/ui/campo-dica"
import { rotuloFornecedor } from "@/lib/fornecedor"
import {
  escolherPasta,
  garantirPermissaoDeEscrita,
  gravarArquivoNaPasta,
  lerPasta,
  navegadorSuportaPastaPadrao,
} from "@/lib/pastas-padrao"
import { formatarMoeda, mascaraMoeda, valorMoedaParaNumero } from "@/lib/mascaras"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { SITUACAO_NFE_BLING_LABEL } from "@/lib/bling-situacao-nfe"
import { validarChaveAcesso } from "@/lib/chave-acesso"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"
import { Icone } from "@/components/admin/icone"

export type Fornecedor = {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj_cpf: string | null
}
// Por onde o item da nota foi reconhecido no catalogo. "cadastrado_agora" e o
// produto criado na hora a partir do proprio item.
type OrigemMapeamento = "codigo_barras" | "sku" | "cadastrado_agora" | "nao_encontrado"

// Explica, item a item, por que ele veio vinculado ou por que nao veio. Sem
// isso o operador so ve "nao achou" e precisa conferir produto por produto pra
// descobrir se o problema e o codigo de barras, o codigo do fornecedor, ou se
// o produto realmente nao existe no catalogo.
function StatusVinculoItem({ item, origem }: { item: ItemNfeXml; origem?: OrigemMapeamento }) {
  if (origem === "codigo_barras") {
    return (
      <p className="mt-1 text-xs text-emerald-600">
        Vinculado pelo código de barras ({item.codigoBarras})
      </p>
    )
  }

  if (origem === "sku") {
    return (
      <p className="mt-1 text-xs text-emerald-600">
        Vinculado pelo código do fornecedor ({item.codigoFornecedor})
      </p>
    )
  }

  if (origem === "cadastrado_agora") {
    return <p className="mt-1 text-xs text-emerald-600">Produto cadastrado agora a partir desta nota</p>
  }

  const motivos = [
    item.codigoBarras
      ? `o código de barras ${item.codigoBarras} não está em nenhum produto`
      : "a nota não traz código de barras para este item",
    item.codigoFornecedor
      ? `nenhum produto tem o SKU ${item.codigoFornecedor}`
      : "a nota não traz código do fornecedor",
  ]

  return (
    <p className="mt-1 text-xs text-amber-600">
      Não encontrado no catálogo — {motivos.join(" e ")}.
    </p>
  )
}

export type ProdutoSelecionavel = {
  id: string
  // Codigo interno do cadastro (migration 058): e por ele que os seletores
  // identificam o produto, no mesmo padrao do resto do sistema.
  codigo: number
  nome: string
  sku: string | null
  codigo_barras: string | null
  custo: string
  estoque: number
}

type NotaEntradaBling = {
  id: string
  numero: string
  serie: string
  dataEmissao: string | null
  situacao: number
  valorTotal: number
  fornecedorNome: string | null
  statusLocal: "pendente" | "lancada" | "cancelada"
}

const SITUACAO_BLING_LABEL = SITUACAO_NFE_BLING_LABEL

// Copia do tipo de lib/nfe-xml.ts, de proposito: importar de la traria o
// parser de XML (fast-xml-parser) pro bundle do navegador sem necessidade -
// aqui a tela so recebe o resultado ja pronto da rota de importacao.
type ItemNfeXml = {
  codigoFornecedor: string
  codigoBarras: string | null
  descricao: string
  ncm: string | null
  quantidade: number
  valorUnitario: number
  valorIcmsSt: number
  valorIpi: number
  valorFrete: number
  valorSeguro: number
  valorOutros: number
  valorDesconto: number
  custoUnitarioReal: number
}

type DadosNfeXml = {
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
  // XML cru devolvido pela rota de importacao, guardado no banco no salvar
  xml: string
  valorFrete: number
  valorTotal: number
}

export type Compra = {
  id: string
  numero_nota: string | null
  chave_acesso: string | null
  status: "pendente" | "recebida" | "cancelada"
  valor_frete: string
  data_compra: string
  data_vencimento: string | null
  observacao: string | null
  criado_em: string
  atualizado_em: string
  fornecedor_id: string
  fornecedor_nome: string
  fornecedor_cnpj_cpf: string | null
  pedido_compra_id: string | null
  pedido_compra_numero: number | null
  valor_itens: string
  data_emissao: string | null
  valor_total_nota: string | null
  serie: string | null
  // Indica se a entrada veio de importacao de XML - so nesse caso da pra
  // gerar o DANFE (ver app/api/admin/compras/[id]/danfe).
  tem_xml: boolean
}

// custoUnitario e o custo REAL do item (produto + ST + IPI + frete rateado -
// desconto). A composicao so existe quando o item veio de XML - no lancamento
// manual, o valor digitado ja e o custo real e nao ha o que decompor.
type ComposicaoCusto = {
  valorProduto: number
  valorIcmsSt: number
  valorIpi: number
  valorFrete: number
  valorSeguro: number
  valorOutros: number
  valorDesconto: number
}

type ItemCarrinho = {
  produtoId: string
  nome: string
  quantidade: number
  custoUnitario: string
  composicao?: ComposicaoCusto
}

// Abre a conta do custo por item: o que o fornecedor cobrou alem do produto.
// Sem isso o custo real seria um numero maior que o da nota sem explicacao, e
// o operador nao teria como conferir se o sistema entendeu a nota direito.
function AcrescimosDoItem({ item }: { item: ItemCarrinho }) {
  if (!item.composicao) {
    return <span className="text-xs text-slate-400">Lançamento manual</span>
  }

  const { valorIcmsSt, valorIpi, valorFrete, valorSeguro, valorOutros, valorDesconto } = item.composicao
  const partes: string[] = []
  if (valorIcmsSt) partes.push(`ST ${formatarMoeda(valorIcmsSt)}`)
  if (valorIpi) partes.push(`IPI ${formatarMoeda(valorIpi)}`)
  if (valorFrete) partes.push(`Frete ${formatarMoeda(valorFrete)}`)
  if (valorSeguro) partes.push(`Seguro ${formatarMoeda(valorSeguro)}`)
  if (valorOutros) partes.push(`Outros ${formatarMoeda(valorOutros)}`)
  if (valorDesconto) partes.push(`Desc. -${formatarMoeda(valorDesconto)}`)

  if (partes.length === 0) {
    return <span className="text-xs text-slate-400">Sem acréscimo</span>
  }

  return (
    <span className="text-xs leading-relaxed text-amber-700">
      {partes.join(" · ")}
      <span className="block text-[11px] text-slate-400">
        rateado entre as {item.quantidade} unidades
      </span>
    </span>
  )
}

const STATUS_ESTILO: Record<Compra["status"], string> = {
  pendente: "selo-atencao",
  recebida: "selo-sucesso",
  cancelada: "selo-neutro",
}

const STATUS_LABEL: Record<Compra["status"], string> = {
  pendente: "Pendente",
  recebida: "Recebida",
  cancelada: "Cancelada",
}

type PedidoCompraParaLancar = {
  id: string
  numero: number
  fornecedor_id: string
  qtdItensSemProduto: number
  itens: { produto_id: string; descricao: string; quantidade: string; custo_unitario: string }[]
}

// Periodo padrao do export: o mes corrente, que e o recorte que o contador
// pede no fechamento.
const hojeIso = new Date().toISOString().slice(0, 10)
const primeiroDiaDoMes = `${hojeIso.slice(0, 7)}-01`

export function ComprasConteudo({
  comprasIniciais,
  fornecedores,
  produtos,
  pedidoCompraParaLancar,
}: {
  comprasIniciais: Compra[]
  fornecedores: Fornecedor[]
  produtos: ProdutoSelecionavel[]
  pedidoCompraParaLancar?: PedidoCompraParaLancar | null
}) {
  const confirmar = useConfirmar()
  const [compras, setCompras] = useState<Compra[]>(comprasIniciais)
  const [fornecedoresDisponiveis, setFornecedoresDisponiveis] = useState<Fornecedor[]>(fornecedores)
  // Catalogo em estado, e nao so a prop: o cadastro de produto a partir de um
  // item do XML precisa aparecer na hora nos seletores, sem recarregar a tela.
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoSelecionavel[]>(produtos)
  const [aba, setAba] = useState(pedidoCompraParaLancar ? "formulario" : "lista")
  const [pedidoCompraVinculado, setPedidoCompraVinculado] = useState<{ id: string; numero: number } | null>(null)
  const [pedidosCompraSugeridos, setPedidosCompraSugeridos] = useState<{ id: string; numero: number }[]>([])

  const [importandoXml, setImportandoXml] = useState(false)
  const [erroXml, setErroXml] = useState("")
  const [chaveXmlInvalida, setChaveXmlInvalida] = useState(false)
  const [itensXmlPendentes, setItensXmlPendentes] = useState<ItemNfeXml[]>([])
  const [mapeamentoXml, setMapeamentoXml] = useState<Record<number, string>>({})
  // Como cada item da nota foi (ou nao foi) reconhecido no catalogo. Fica
  // visivel no item pra o operador entender por que aquele nao veio vinculado
  // - "nao achou" sem motivo obriga a conferir produto por produto na mao.
  const [origemMapeamento, setOrigemMapeamento] = useState<Record<number, OrigemMapeamento>>({})
  const [cadastrandoProdutoIndice, setCadastrandoProdutoIndice] = useState<number | null>(null)
  const inputXmlRef = useRef<HTMLInputElement>(null)

  const [fornecedorId, setFornecedorId] = useState("")
  // Nome do fornecedor que a importacao acabou de criar - usado so pro aviso
  // de "confira o cadastro"; limpo quando o fornecedor da nota ja existia.
  const [fornecedorCriadoPeloXml, setFornecedorCriadoPeloXml] = useState<string | null>(null)
  const [numeroNota, setNumeroNota] = useState("")
  const [chaveAcesso, setChaveAcesso] = useState("")
  // XML cru + dados da nota que so existem quando a entrada veio de
  // importacao. Ficam no estado ate o salvar, pra so gravar o arquivo se a
  // compra for de fato confirmada (ver app/api/admin/compras/importar-xml).
  const [exportandoXmls, setExportandoXmls] = useState(false)
  const [exportInicio, setExportInicio] = useState(primeiroDiaDoMes)
  const [exportFim, setExportFim] = useState(hojeIso)
  const [exportCampoData, setExportCampoData] = useState<"emissao" | "compra">("emissao")
  const [exportFornecedor, setExportFornecedor] = useState("")
  const [exportStatus, setExportStatus] = useState("")
  const [exportNumeroNota, setExportNumeroNota] = useState("")
  const [exportIncluir, setExportIncluir] = useState<"xml" | "pdf" | "ambos">("ambos")
  const [xmlImportado, setXmlImportado] = useState<string | null>(null)
  const [serie, setSerie] = useState("")
  // Emissao e total da nota agora tambem sao digitaveis: antes so o XML
  // preenchia, e nota manual ficava sem competencia nenhuma - some de
  // qualquer relatorio por mes de emissao.
  const [dataEmissaoNota, setDataEmissaoNota] = useState("")
  const [valorTotalNota, setValorTotalNota] = useState("")
  const [dataCompra, setDataCompra] = useState(() => new Date().toISOString().slice(0, 10))
  const [dataVencimento, setDataVencimento] = useState("")
  const [valorFrete, setValorFrete] = useState("")
  const [observacao, setObservacao] = useState("")
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  // Frete da nota importada, ja embutido no custo dos itens. Guardado so pra
  // avisar na tela por que o campo de frete ficou vazio.
  const [freteRateadoNosItens, setFreteRateadoNosItens] = useState(0)

  const [produtoId, setProdutoId] = useState("")
  const [quantidade, setQuantidade] = useState("1")
  const [custoUnitario, setCustoUnitario] = useState("")

  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [carregandoEdicao, setCarregandoEdicao] = useState(false)
  const [detalhe, setDetalhe] = useState<Compra | null>(null)

  // Veio do link "Lancar entrada" de um Pedido de Compra (ver
  // app/admin/compras/page.tsx) - pre-preenche fornecedor e itens (so os que
  // tem produto vinculado no catalogo; itens avulsos precisam ser adicionados
  // na mao, ja que a Entrada de NF exige produto cadastrado por item).
  useEffect(() => {
    if (!pedidoCompraParaLancar) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-preenchimento unico a partir de prop, nao sincronizacao continua
    setFornecedorId(pedidoCompraParaLancar.fornecedor_id)
    setItens(
      pedidoCompraParaLancar.itens.map((i) => {
        const produto = produtosDisponiveis.find((p) => p.id === i.produto_id)
        return {
          produtoId: i.produto_id,
          nome: produto?.nome ?? i.descricao,
          quantidade: Number(i.quantidade),
          custoUnitario: mascaraMoeda(String(Math.round(Number(i.custo_unitario) * 100))),
        }
      })
    )
    setPedidoCompraVinculado({ id: pedidoCompraParaLancar.id, numero: pedidoCompraParaLancar.numero })
    if (pedidoCompraParaLancar.qtdItensSemProduto > 0) {
      toast.warning(
        `${pedidoCompraParaLancar.qtdItensSemProduto} item(ns) desse pedido de compra não tem produto vinculado do catálogo e precisam ser adicionados na mão.`
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [filtroFornecedor, setFiltroFornecedor] = useState("")
  const [filtroNumeroNota, setFiltroNumeroNota] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<"todos" | Compra["status"]>("todos")
  const [filtroObservacao, setFiltroObservacao] = useState("")
  const [filtroDataCompraDe, setFiltroDataCompraDe] = useState("")
  const [filtroDataCompraAte, setFiltroDataCompraAte] = useState("")
  const [filtroDataEntradaDe, setFiltroDataEntradaDe] = useState("")
  const [filtroDataEntradaAte, setFiltroDataEntradaAte] = useState("")
  const [filtroPedidoCompra, setFiltroPedidoCompra] = useState("")

  function limparFiltros() {
    setFiltroFornecedor("")
    setFiltroNumeroNota("")
    setFiltroStatus("todos")
    setFiltroObservacao("")
    setFiltroDataCompraDe("")
    setFiltroDataCompraAte("")
    setFiltroDataEntradaDe("")
    setFiltroDataEntradaAte("")
    setFiltroPedidoCompra("")
  }

  const comprasFiltradas = compras.filter((compra) => {
    if (filtroFornecedor && compra.fornecedor_id !== filtroFornecedor) return false
    if (filtroStatus !== "todos" && compra.status !== filtroStatus) return false
    if (
      filtroNumeroNota &&
      !(compra.numero_nota || "").toLowerCase().includes(filtroNumeroNota.trim().toLowerCase())
    )
      return false
    if (
      filtroObservacao &&
      !(compra.observacao || "").toLowerCase().includes(filtroObservacao.trim().toLowerCase())
    )
      return false
    if (filtroDataCompraDe && compra.data_compra.slice(0, 10) < filtroDataCompraDe) return false
    if (filtroDataCompraAte && compra.data_compra.slice(0, 10) > filtroDataCompraAte) return false
    if (filtroDataEntradaDe || filtroDataEntradaAte) {
      if (compra.status !== "recebida") return false
      const dataEntrada = compra.atualizado_em.slice(0, 10)
      if (filtroDataEntradaDe && dataEntrada < filtroDataEntradaDe) return false
      if (filtroDataEntradaAte && dataEntrada > filtroDataEntradaAte) return false
    }
    if (filtroPedidoCompra) {
      const numeroFormatado = compra.pedido_compra_numero
        ? `PC.${String(compra.pedido_compra_numero).padStart(4, "0")}`
        : ""
      if (!numeroFormatado.toLowerCase().includes(filtroPedidoCompra.trim().toLowerCase())) return false
    }
    return true
  })

  const [notasBling, setNotasBling] = useState<NotaEntradaBling[]>([])
  const [carregandoNotasBling, setCarregandoNotasBling] = useState(false)
  const [erroNotasBling, setErroNotasBling] = useState("")
  const [filtroStatusBling, setFiltroStatusBling] = useState<"todas" | "pendente" | "lancada" | "cancelada">(
    "pendente"
  )
  const [blingNotaVinculada, setBlingNotaVinculada] = useState<{ id: string; numero: string } | null>(null)

  async function buscarNotasBling() {
    setErroNotasBling("")
    setCarregandoNotasBling(true)
    const resposta = await fetch("/api/admin/bling/notas-entrada")
    const dados = await resposta.json()
    setCarregandoNotasBling(false)

    if (!resposta.ok) {
      setErroNotasBling(dados.erro || "Erro ao consultar notas no Bling")
      return
    }
    setNotasBling(dados)
  }

  function lancarEntradaDeNotaBling(nota: NotaEntradaBling) {
    abrirNova()
    setBlingNotaVinculada({ id: nota.id, numero: nota.numero })
    setNumeroNota(nota.numero)
    setAba("formulario")
  }

  const notasBlingFiltradas =
    filtroStatusBling === "todas" ? notasBling : notasBling.filter((n) => n.statusLocal === filtroStatusBling)

  async function recarregar() {
    const resposta = await fetch("/api/admin/compras")
    setCompras(await resposta.json())
  }

  function abrirNova() {
    setEditandoId(null)
    setFornecedorId("")
    setNumeroNota("")
    setChaveAcesso("")
    setXmlImportado(null)
    setSerie("")
    setDataEmissaoNota("")
    setValorTotalNota("")
    setDataCompra(new Date().toISOString().slice(0, 10))
    setDataVencimento("")
    setValorFrete("")
    setObservacao("")
    setItens([])
    setProdutoId("")
    setQuantidade("1")
    setCustoUnitario("")
    setErro("")
    setErroXml("")
    setChaveXmlInvalida(false)
    setItensXmlPendentes([])
    setMapeamentoXml({})
    setBlingNotaVinculada(null)
    setPedidoCompraVinculado(null)
    setPedidosCompraSugeridos([])
    setAba("formulario")
  }

  // So compra "pendente" pode ser editada (ver PUT em app/api/admin/compras/[id]) -
  // uma vez recebida ja afetou estoque/custo/financeiro.
  async function abrirEdicao(compra: Compra) {
    setCarregandoEdicao(true)
    const resposta = await fetch(`/api/admin/compras/${compra.id}`)
    setCarregandoEdicao(false)
    if (!resposta.ok) {
      toast.error("Erro ao carregar a compra pra edição")
      return
    }
    const dados = await resposta.json()

    setEditandoId(compra.id)
    setFornecedorId(dados.fornecedor_id)
    setNumeroNota(dados.numero_nota || "")
    setChaveAcesso(dados.chave_acesso || "")
    setXmlImportado(null)
    setSerie(dados.serie || "")
    setDataEmissaoNota(dados.data_emissao ? String(dados.data_emissao).slice(0, 10) : "")
    setValorTotalNota(
      dados.valor_total_nota ? mascaraMoeda(String(Math.round(Number(dados.valor_total_nota) * 100))) : ""
    )
    setDataCompra(String(dados.data_compra).slice(0, 10))
    setDataVencimento(dados.data_vencimento ? String(dados.data_vencimento).slice(0, 10) : "")
    setValorFrete(mascaraMoeda(String(Math.round(Number(dados.valor_frete) * 100))))
    setObservacao(dados.observacao || "")
    setItens(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- item vem direto da API, formato conhecido
      dados.itens.map((i: any) => ({
        produtoId: i.produto_id,
        nome: i.produto_nome,
        quantidade: i.quantidade,
        custoUnitario: mascaraMoeda(String(Math.round(Number(i.custo_unitario) * 100))),
      }))
    )
    setProdutoId("")
    setQuantidade("1")
    setCustoUnitario("")
    setErro("")
    setErroXml("")
    setChaveXmlInvalida(false)
    setItensXmlPendentes([])
    setMapeamentoXml({})
    setBlingNotaVinculada(null)
    setPedidoCompraVinculado(null)
    setPedidosCompraSugeridos([])
    setAba("formulario")
  }

  async function excluir(compra: Compra) {
    if (
      !(await confirmar({
        descricao: `Excluir a compra de "${compra.fornecedor_nome}"? Essa ação não pode ser desfeita.`,
        destrutivo: true,
      }))
    )
      return

    setProcessandoId(compra.id)
    const resposta = await fetch(`/api/admin/compras/${compra.id}`, { method: "DELETE" })
    setProcessandoId(null)

    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir compra")
      return
    }

    registrarAuditoria({
      tela: "Entrada de NF",
      acao: "exclusao",
      tabela: "TAB_COMPRA",
      registroId: compra.id,
      antes: { fornecedor_nome: compra.fornecedor_nome, numero_nota: compra.numero_nota },
    })
    recarregar()
  }

  function adicionarItem() {
    const produto = produtosDisponiveis.find((p) => p.id === produtoId)
    if (!produto) return
    const qtd = Number(quantidade)
    if (!(qtd > 0)) return

    setItens((atual) => [
      ...atual,
      {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: qtd,
        custoUnitario: custoUnitario || mascaraMoeda(String(Math.round(Number(produto.custo) * 100))),
      },
    ])
    setProdutoId("")
    setQuantidade("1")
    setCustoUnitario("")
  }

  function removerItem(produtoId: string) {
    setItens((atual) => atual.filter((i) => i.produtoId !== produtoId))
  }

  // Le e valida o XML no servidor (lib/nfe-xml.ts) - nunca grava nada
  // sozinho no banco. Fornecedor so e criado automaticamente aqui (decisao
  // do usuario); os itens ficam pendentes de mapeamento manual pro admin
  // associar cada um a um produto do catalogo antes de entrarem na compra.
  async function importarXml(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setErroXml("")
    setImportandoXml(true)

    const formData = new FormData()
    formData.append("arquivo", arquivo)

    const resposta = await fetch("/api/admin/compras/importar-xml", { method: "POST", body: formData })
    const dados: DadosNfeXml | { erro: string } = await resposta.json()
    setImportandoXml(false)
    if (inputXmlRef.current) inputXmlRef.current.value = ""

    if (!resposta.ok || "erro" in dados) {
      setErroXml("erro" in dados ? dados.erro : "Erro ao ler o XML")
      return
    }

    setChaveXmlInvalida(!dados.chaveValida)
    if (dados.chaveAcesso) setChaveAcesso(dados.chaveAcesso)
    setXmlImportado(dados.xml)
    if (dados.serie) setSerie(dados.serie)
    if (dados.dataEmissao) setDataEmissaoNota(dados.dataEmissao)
    setValorTotalNota(mascaraMoeda(String(Math.round(dados.valorTotal * 100))))

    const cnpjEmitente = dados.emitente.cnpj
    const fornecedorExistente = fornecedoresDisponiveis.find(
      (f) => f.cnpj_cpf?.replace(/\D/g, "") === cnpjEmitente
    )

    let fornecedorIdResolvido: string | null = null

    if (fornecedorExistente) {
      setFornecedorCriadoPeloXml(null)
      setFornecedorId(fornecedorExistente.id)
      fornecedorIdResolvido = fornecedorExistente.id
    } else {
      const respostaFornecedor = await fetch("/api/admin/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razaoSocial: dados.emitente.razaoSocial,
          nomeFantasia: dados.emitente.nomeFantasia,
          cnpjCpf: cnpjEmitente,
          telefone: dados.emitente.telefone,
          cep: dados.emitente.cep,
          logradouro: dados.emitente.logradouro,
          numero: dados.emitente.numero,
          bairro: dados.emitente.bairro,
          cidade: dados.emitente.cidade,
          estado: dados.emitente.estado,
        }),
      })
      if (respostaFornecedor.ok) {
        const novoFornecedor = await respostaFornecedor.json()
        setFornecedoresDisponiveis((atual) => [...atual, novoFornecedor])
        setFornecedorId(novoFornecedor.id)
        fornecedorIdResolvido = novoFornecedor.id
        setFornecedorCriadoPeloXml(novoFornecedor.razao_social)
        toast.warning(
          `Fornecedor "${novoFornecedor.razao_social}" foi cadastrado automaticamente pelo XML. Confira o cadastro depois — a nota não traz inscrição estadual, e-mail nem condição de pagamento.`,
          { duration: 10000 }
        )
        registrarAuditoria({
          tela: "Entrada de NF (importação XML)",
          acao: "cadastro",
          tabela: "TAB_FORNECEDOR",
          registroId: novoFornecedor.id,
          depois: { razao_social: novoFornecedor.razao_social, cnpj_cpf: novoFornecedor.cnpj_cpf },
        })
      }
    }

    // Sugere vincular a um Pedido de Compra ja enviado desse fornecedor -
    // admin escolhe manualmente (pode ter mais de um em aberto).
    setPedidosCompraSugeridos([])
    if (fornecedorIdResolvido) {
      const respostaPedidos = await fetch(
        `/api/admin/pedidos-compra?fornecedorId=${fornecedorIdResolvido}&status=enviado`
      )
      if (respostaPedidos.ok) {
        setPedidosCompraSugeridos(await respostaPedidos.json())
      }
    }

    if (dados.numero) setNumeroNota(dados.numero)
    if (dados.dataEmissao) setDataCompra(dados.dataEmissao)
    // O frete da nota NAO vai mais pro campo de frete da compra: ele ja foi
    // rateado entre os itens e entrou no custo de cada um. Preencher os dois
    // faria o frete contar duas vezes no total da compra e na conta a pagar.
    setFreteRateadoNosItens(dados.valorFrete > 0 ? dados.valorFrete : 0)
    setValorFrete("")

    setItensXmlPendentes(dados.itens)
    // Pre-seleciona por codigo de barras (mais confiavel, o EAN e o mesmo
    // em qualquer lugar) e cai pro SKU se nao achar - o admin ainda confirma
    // (ou troca) cada item antes de adicionar.
    const mapeamentoInicial: Record<number, string> = {}
    const origemInicial: Record<number, OrigemMapeamento> = {}
    dados.itens.forEach((item, indice) => {
      const produtoPorCodigoBarras =
        item.codigoBarras && produtosDisponiveis.find((p) => p.codigo_barras && p.codigo_barras === item.codigoBarras)
      const produtoPorSku = produtosDisponiveis.find((p) => p.sku && p.sku === item.codigoFornecedor)

      if (produtoPorCodigoBarras) {
        mapeamentoInicial[indice] = produtoPorCodigoBarras.id
        origemInicial[indice] = "codigo_barras"
      } else if (produtoPorSku) {
        mapeamentoInicial[indice] = produtoPorSku.id
        origemInicial[indice] = "sku"
      } else {
        origemInicial[indice] = "nao_encontrado"
      }
    })
    setMapeamentoXml(mapeamentoInicial)
    setOrigemMapeamento(origemInicial)
  }

  // Cria o produto direto do item da nota. O objetivo e a virada de sistema:
  // a primeira nota importada tem o catalogo inteiro do fornecedor dentro, e
  // cadastrar item por item na mao seria horas de digitacao.
  //
  // O preco de venda nasce igual ao custo de proposito - preco e decisao
  // comercial, nao tem no XML, e chutar margem aqui sairia errado em silencio.
  // Melhor o produto nascer visivelmente sem margem e o cliente precificar
  // depois em Produtos > Reajuste de Precos.
  async function cadastrarProdutoDoItem(indice: number) {
    const itemXml = itensXmlPendentes[indice]
    if (!itemXml) return

    if (!itemXml.ncm) {
      toast.error("Esse item não tem NCM no XML, e o NCM é obrigatório no cadastro. Cadastre o produto manualmente.")
      return
    }

    setCadastrandoProdutoIndice(indice)
    const resposta = await fetch("/api/admin/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: itemXml.descricao,
        preco: itemXml.valorUnitario,
        estoque: 0,
        // O codigo do fornecedor vira SKU: e o que faz a proxima nota desse
        // mesmo fornecedor vincular sozinha.
        sku: itemXml.codigoFornecedor || null,
        codigoBarras: itemXml.codigoBarras || null,
        ncm: itemXml.ncm,
      }),
    })
    setCadastrandoProdutoIndice(null)

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null)
      toast.error(dados?.erro ?? "Não foi possível cadastrar o produto")
      return
    }

    // A rota de produtos devolve so os campos da grade (id, nome, preco...),
    // sem sku/codigo_barras/custo - entao monta o item do seletor com o que a
    // gente acabou de enviar. Sem isso, dois itens da MESMA nota com o mesmo
    // codigo nao se reconheceriam entre si.
    const criado: { id: string; codigo: number; nome: string } = await resposta.json()
    const novoProduto: ProdutoSelecionavel = {
      id: criado.id,
      codigo: criado.codigo,
      nome: criado.nome,
      sku: itemXml.codigoFornecedor || null,
      codigo_barras: itemXml.codigoBarras || null,
      custo: String(itemXml.valorUnitario),
      estoque: 0,
    }
    setProdutosDisponiveis((atual) => [...atual, novoProduto])
    setMapeamentoXml((atual) => ({ ...atual, [indice]: novoProduto.id }))
    setOrigemMapeamento((atual) => ({ ...atual, [indice]: "cadastrado_agora" }))
    registrarAuditoria({
      tela: "Entrada de NF (importação XML)",
      acao: "cadastro",
      tabela: "TAB_PRODUTO",
      registroId: novoProduto.id,
      depois: { nome: novoProduto.nome, sku: novoProduto.sku },
    })
    toast.success(`Produto "${novoProduto.nome}" cadastrado. Defina o preço de venda depois em Produtos.`)
  }

  function adicionarItemMapeado(indice: number) {
    const itemXml = itensXmlPendentes[indice]
    const produtoIdSelecionado = mapeamentoXml[indice]
    const produto = produtosDisponiveis.find((p) => p.id === produtoIdSelecionado)
    if (!itemXml || !produto) return

    setItens((atual) => [
      ...atual,
      {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: itemXml.quantidade || 1,
        // O custo que entra e o REAL, e nao o preco do produto: e ele que vira
        // custo medio quando a compra for recebida.
        custoUnitario: mascaraMoeda(String(Math.round(itemXml.custoUnitarioReal * 100))),
        composicao: {
          valorProduto: itemXml.valorUnitario,
          valorIcmsSt: itemXml.valorIcmsSt,
          valorIpi: itemXml.valorIpi,
          valorFrete: itemXml.valorFrete,
          valorSeguro: itemXml.valorSeguro,
          valorOutros: itemXml.valorOutros,
          valorDesconto: itemXml.valorDesconto,
        },
      },
    ])
    setItensXmlPendentes((atual) => atual.filter((_, i) => i !== indice))
  }

  const totalItens = itens.reduce((soma, i) => soma + i.quantidade * valorMoedaParaNumero(i.custoUnitario), 0)
  const totalCompra = totalItens + valorMoedaParaNumero(valorFrete || "0,00")

  async function salvar() {
    setErro("")

    if (!fornecedorId) {
      setErro("Selecione um fornecedor")
      return
    }
    if (itens.length === 0) {
      setErro("Adicione pelo menos um item")
      return
    }

    if (chaveAcesso && chaveAcesso.length === 44 && !validarChaveAcesso(chaveAcesso)) {
      setErro("A chave de acesso digitada não é válida - confira os 44 dígitos.")
      return
    }

    setSalvando(true)

    const corpo = {
      fornecedorId,
      numeroNota: numeroNota || null,
      chaveAcesso: chaveAcesso || null,
      valorFrete: valorMoedaParaNumero(valorFrete || "0,00"),
      dataCompra,
      dataVencimento: dataVencimento || null,
      observacao: observacao || null,
      itens: itens.map((i) => ({
        produtoId: i.produtoId,
        quantidade: i.quantidade,
        custoUnitario: valorMoedaParaNumero(i.custoUnitario),
        // Composicao vinda do XML. No lancamento manual ela nao existe, e o
        // servidor trata o custo digitado como valor de produto sem acrescimo.
        ...(i.composicao ?? {}),
      })),
      blingNotaId: blingNotaVinculada?.id || null,
      pedidoCompraId: pedidoCompraVinculado?.id || null,
      xmlNfe: xmlImportado,
      serie: serie || null,
      dataEmissao: dataEmissaoNota || null,
      valorTotalNota: valorTotalNota ? valorMoedaParaNumero(valorTotalNota) : null,
    }

    const resposta = editandoId
      ? await fetch(`/api/admin/compras/${editandoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        })
      : await fetch("/api/admin/compras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    const salva = await resposta.json()

    if (xmlImportado) {
      await copiarXmlParaPastaPadrao(xmlImportado, chaveAcesso, numeroNota || null)
    }

    registrarAuditoria({
      tela: "Entrada de NF",
      acao: editandoId ? "edicao" : "cadastro",
      tabela: "TAB_COMPRA",
      registroId: salva.id,
      depois: { fornecedor_id: fornecedorId, itens: itens.length },
    })

    setAba("lista")
    recarregar()
  }

  // Copia automatica do XML na pasta configurada em Configuracoes > Pastas
  // das Notas Fiscais. Roda depois de a compra ja estar salva no banco, e
  // qualquer falha aqui e so avisada: a copia em pasta e conveniencia, o
  // arquivo que vale ja esta guardado no banco. Falhar aqui nunca pode dar a
  // impressao de que o lancamento nao foi salvo.
  async function copiarXmlParaPastaPadrao(xml: string, chave: string, numero: string | null) {
    if (!navegadorSuportaPastaPadrao()) return

    try {
      const pasta = await lerPasta("salvar")
      if (!pasta) return
      if (!(await garantirPermissaoDeEscrita(pasta))) return

      const nome = chave ? `${chave}.xml` : `nota-${(numero || "sem-numero").replace(/\W/g, "")}.xml`
      await gravarArquivoNaPasta(pasta, nome, xml, false)
      toast.success(`XML arquivado em "${pasta.name}"`)
    } catch {
      toast.error("A compra foi salva, mas não deu para copiar o XML para a pasta configurada")
    }
  }

  // Abre o DANFE numa aba nova, no visualizador de PDF do navegador - de la
  // o operador imprime com Ctrl+P, que e o fluxo que ele ja conhece.
  function abrirDanfe(compra: Compra) {
    window.open(`/api/admin/compras/${compra.id}/danfe`, "_blank")
  }

  // Monta a URL uma vez so - os dois modos de salvar usam o mesmo endpoint,
  // mudando so o formato (ver app/api/admin/compras/exportar-xml).
  function urlExport(formato: "zip" | "lista") {
    const parametros = new URLSearchParams({
      inicio: exportInicio,
      fim: exportFim,
      formato,
      campoData: exportCampoData,
      incluir: exportIncluir,
    })
    if (exportFornecedor) parametros.set("fornecedorId", exportFornecedor)
    if (exportStatus) parametros.set("status", exportStatus)
    if (exportNumeroNota) parametros.set("numeroNota", exportNumeroNota)

    return `/api/admin/compras/exportar-xml?${parametros.toString()}`
  }

  async function lerErroDoExport(resposta: Response): Promise<string> {
    const dados = await resposta.json().catch(() => null)
    return dados?.erro || "Erro ao exportar os XMLs"
  }

  // Modo "tudo num arquivo": baixa o .zip pela pasta de downloads do
  // navegador. Usa blob (e nao um link direto pro endpoint) pra conseguir
  // mostrar a mensagem de erro numa toast em vez de jogar o JSON na tela.
  async function exportarXmlsZip() {
    setExportandoXmls(true)
    try {
      const resposta = await fetch(urlExport("zip"))
      if (!resposta.ok) {
        toast.error(await lerErroDoExport(resposta))
        return
      }

      const blob = await resposta.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `notas-entrada-${exportInicio}-a-${exportFim}.zip`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Download do .zip iniciado")
    } finally {
      setExportandoXmls(false)
    }
  }

  // Modo "arquivos separados": grava um .xml por nota dentro da pasta que o
  // operador escolher. So o Chrome/Edge tem a API de escolher pasta - nos
  // outros navegadores o caminho continua sendo o .zip.
  async function exportarXmlsParaPasta() {
    if (!navegadorSuportaPastaPadrao()) {
      toast.error("Este navegador não permite escolher a pasta. Use o botão \"Baixar .zip\".")
      return
    }

    // Usa a pasta padrao de exportacao, se o operador ja configurou em
    // Configuracoes > Pastas das Notas Fiscais. Sem ela, cai no seletor -
    // a resolucao vem antes do setExportandoXmls porque cancelar o seletor
    // nao e erro e nao deve travar o botao nem mostrar mensagem.
    const pasta = (await lerPasta("exportar")) ?? (await escolherPasta())
    if (!pasta) return

    if (!(await garantirPermissaoDeEscrita(pasta))) {
      toast.error("O navegador não liberou permissão de escrita nessa pasta")
      return
    }

    setExportandoXmls(true)
    try {
      const resposta = await fetch(urlExport("lista"))
      if (!resposta.ok) {
        toast.error(await lerErroDoExport(resposta))
        return
      }

      const { arquivos } = (await resposta.json()) as {
        arquivos: { nome: string; conteudo: string; tipo: "xml" | "pdf" }[]
      }

      for (const arquivo of arquivos) {
        await gravarArquivoNaPasta(pasta, arquivo.nome, arquivo.conteudo, arquivo.tipo === "pdf")
      }

      toast.success(`${arquivos.length} arquivo(s) salvos em "${pasta.name}"`)
    } catch {
      toast.error("Não foi possível salvar os arquivos na pasta escolhida")
    } finally {
      setExportandoXmls(false)
    }
  }

  async function receber(compra: Compra) {
    if (
      !(await confirmar({
        titulo: "Receber a compra",
        descricao: `Confirmar o recebimento da compra de "${compra.fornecedor_nome}"?`,
        textoConfirmar: "Receber",
        consequencia:
          "O estoque dos itens entra na hora, o custo dos produtos é atualizado e uma conta a pagar é gerada no financeiro. Depois de recebida, a compra não pode mais ser cancelada.",
        aoCancelar: "a compra continua lançada, sem mexer no estoque nem no financeiro.",
      }))
    )
      return

    setProcessandoId(compra.id)
    const resposta = await fetch(`/api/admin/compras/${compra.id}/receber`, { method: "POST" })
    setProcessandoId(null)

    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao receber compra")
      return
    }

    registrarAuditoria({
      tela: "Entrada de NF",
      acao: "edicao",
      tabela: "TAB_COMPRA",
      registroId: compra.id,
      antes: { status: "pendente" },
      depois: { status: "recebida" },
    })
    recarregar()
  }

  async function cancelar(compra: Compra) {
    if (!(await confirmar({ descricao: `Cancelar a compra de "${compra.fornecedor_nome}"?`, destrutivo: true, consequencia: "A entrada fica cancelada. Compra que já foi recebida não pode ser cancelada, porque já mexeu em estoque, custo e financeiro." }))) return

    setProcessandoId(compra.id)
    const resposta = await fetch(`/api/admin/compras/${compra.id}/cancelar`, { method: "POST" })
    setProcessandoId(null)

    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao cancelar compra")
      return
    }

    registrarAuditoria({
      tela: "Entrada de NF",
      acao: "edicao",
      tabela: "TAB_COMPRA",
      registroId: compra.id,
      antes: { status: "pendente" },
      depois: { status: "cancelada" },
    })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Entrada de NF</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lista">
              <ClipboardList size={14} className="mr-1.5" />
              Grade
            </TabsTrigger>
            <TabsTrigger value="formulario">
              <Icone nome="novo" tamanho={15} className="mr-1.5" />
              Cadastro
            </TabsTrigger>
            <TabsTrigger value="notas-bling" onClick={() => notasBling.length === 0 && buscarNotasBling()}>
              <Radio size={14} className="mr-1.5" />
              Notas do Bling
            </TabsTrigger>
          </TabsList>
          {aba === "lista" && (
            <Button onClick={abrirNova}>
              <Icone nome="novo" tamanho={17} className="mr-2" />
              Nova compra
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4 space-y-4">
          <Card>
            <CardContent className="grid items-end gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs">Fornecedor</Label>
                <select
                  value={filtroFornecedor}
                  onChange={(e) => setFiltroFornecedor(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Todos</option>
                  {fornecedoresDisponiveis.map((f) => (
                    <option key={f.id} value={f.id}>
                      {rotuloFornecedor(f)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Número da nota</Label>
                <Input value={filtroNumeroNota} onChange={(e) => setFiltroNumeroNota(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="recebida">Recebida</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Observação/descrição</Label>
                <Input value={filtroObservacao} onChange={(e) => setFiltroObservacao(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data da compra - de</Label>
                <Input type="date" value={filtroDataCompraDe} onChange={(e) => setFiltroDataCompraDe(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data da compra - até</Label>
                <Input type="date" value={filtroDataCompraAte} onChange={(e) => setFiltroDataCompraAte(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  Data de entrada - de
                  <CampoDica>Data em que a compra foi recebida (deu entrada no estoque).</CampoDica>
                </Label>
                <Input
                  type="date"
                  value={filtroDataEntradaDe}
                  onChange={(e) => setFiltroDataEntradaDe(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data de entrada - até</Label>
                <Input
                  type="date"
                  value={filtroDataEntradaAte}
                  onChange={(e) => setFiltroDataEntradaAte(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  Pedido de compra
                  <CampoDica>Número do Pedido de Compra que originou essa entrada (ex: PC.0001).</CampoDica>
                </Label>
                <Input
                  value={filtroPedidoCompra}
                  onChange={(e) => setFiltroPedidoCompra(e.target.value)}
                  placeholder="PC.0001"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Button type="button" variant="outline" size="sm" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div>
                <h2 className="text-sm font-semibold">Exportar XMLs para a contabilidade</h2>
                <p className="text-xs text-slate-500">
                  Baixa os XMLs das notas de entrada do período, para enviar ao contador. O filtro é
                  pela data de emissão da nota, que é o mês de competência.
                </p>
              </div>
              <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-xs">
                    Filtrar período por
                    <CampoDica>
                      <strong>Data de emissão</strong> é quando o fornecedor emitiu a nota — é o mês
                      de competência, o recorte que o contador usa no fechamento. Uma nota emitida em
                      30/06 e lançada aqui em 02/07 pertence a junho.
                      <br />
                      <br />
                      <strong>Data da compra</strong> é quando a entrada foi lançada neste sistema.
                      Use quando quiser conferir o que foi digitado num período.
                    </CampoDica>
                  </Label>
                  <select
                    value={exportCampoData}
                    onChange={(e) => setExportCampoData(e.target.value as "emissao" | "compra")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="emissao">Data de emissão da nota</option>
                    <option value="compra">Data da compra (lançamento)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">De</Label>
                  <Input type="date" value={exportInicio} onChange={(e) => setExportInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Até</Label>
                  <Input type="date" value={exportFim} onChange={(e) => setExportFim(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fornecedor</Label>
                  <select
                    value={exportFornecedor}
                    onChange={(e) => setExportFornecedor(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Todos</option>
                    {fornecedoresDisponiveis.map((f) => (
                      <option key={f.id} value={f.id}>
                        {rotuloFornecedor(f)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Situação
                    <CampoDica>
                      Sem escolher nada, o lote sai com as pendentes e as recebidas, e deixa as
                      canceladas de fora — nota cancelada no lote do contador só gera confusão. Para
                      conferir alguma cancelada em específico, escolha aqui.
                    </CampoDica>
                  </Label>
                  <select
                    value={exportStatus}
                    onChange={(e) => setExportStatus(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Pendentes e recebidas</option>
                    <option value="pendente">Só pendentes</option>
                    <option value="recebida">Só recebidas</option>
                    <option value="cancelada">Só canceladas</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Número da nota</Label>
                  <Input
                    value={exportNumeroNota}
                    onChange={(e) => setExportNumeroNota(e.target.value)}
                    placeholder="Todas"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    O que exportar
                    <CampoDica>
                      <strong>XML</strong> é o arquivo que tem valor fiscal — é o que o contador
                      importa no sistema dele e o que precisa ser guardado por 5 anos.
                      <br />
                      <br />
                      <strong>DANFE em PDF</strong> é a representação para ler e imprimir. É gerado
                      na hora a partir do XML, então só existe para notas importadas por XML.
                    </CampoDica>
                  </Label>
                  <select
                    value={exportIncluir}
                    onChange={(e) => setExportIncluir(e.target.value as "xml" | "pdf" | "ambos")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="ambos">XML + DANFE em PDF</option>
                    <option value="xml">Só o XML</option>
                    <option value="pdf">Só o DANFE em PDF</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                  <Button type="button" onClick={exportarXmlsZip} disabled={exportandoXmls}>
                    <Icone nome="baixar" tamanho={17} className="mr-2" />
                    Baixar .zip
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={exportarXmlsParaPasta}
                    disabled={exportandoXmls}
                  >
                    <FolderDown size={16} className="mr-2" />
                    Salvar em uma pasta
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Só entram notas importadas por XML. Nota lançada manualmente não tem arquivo, e nota
                importada antes desta atualização não teve o XML guardado.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {compras.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma compra cadastrada ainda.</p>
              ) : comprasFiltradas.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma compra encontrada com esses filtros.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-4 font-medium">Fornecedor</th>
                        <th className="p-4 font-medium">NF</th>
                        <th className="p-4 font-medium">Pedido de compra</th>
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comprasFiltradas.map((compra) => (
                        <tr key={compra.id} className="border-b border-slate-200 last:border-0">
                          <td className="p-4 font-medium">{compra.fornecedor_nome}</td>
                          <td className="p-4 text-slate-500">
                            {compra.numero_nota || "-"}
                            {compra.chave_acesso && (
                              <div className="text-xs text-slate-400" title={compra.chave_acesso}>
                                {compra.chave_acesso}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-slate-500">
                            {compra.pedido_compra_numero
                              ? `PC.${String(compra.pedido_compra_numero).padStart(4, "0")}`
                              : "-"}
                          </td>
                          <td className="p-4 text-slate-500">
                            {new Date(compra.data_compra).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-4">
                            {formatarMoeda(Number(compra.valor_itens) + Number(compra.valor_frete))}
                          </td>
                          <td className="p-4">
                            <span className={`rounded-full px-2 py-1 text-xs ${STATUS_ESTILO[compra.status]}`}>
                              {STATUS_LABEL[compra.status]}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={() => setDetalhe(compra)}
                              title="Ver detalhe"
                            >
                              <Icone nome="ver" tamanho={18} />
                            </Button>
                            {compra.tem_xml && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={() => abrirDanfe(compra)}
                                title="Ver/imprimir o DANFE"
                              >
                                <FileText size={16} className="text-slate-600" />
                              </Button>
                            )}
                            {compra.status === "pendente" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  disabled={processandoId === compra.id}
                                  onClick={() => abrirEdicao(compra)}
                                  title="Editar"
                                >
                                  <Icone nome="editar" tamanho={18} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  disabled={processandoId === compra.id}
                                  onClick={() => receber(compra)}
                                  title="Receber (da alta no estoque e atualiza custo)"
                                >
                                  <PackageCheck size={16} className="text-emerald-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  disabled={processandoId === compra.id}
                                  onClick={() => cancelar(compra)}
                                  title="Cancelar"
                                >
                                  <Ban size={16} className="text-red-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  disabled={processandoId === compra.id}
                                  onClick={() => excluir(compra)}
                                  title="Excluir"
                                >
                                  <Icone nome="excluir" tamanho={18} />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">
              {editandoId ? "Editando compra" : "Nova compra"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAba("lista")}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando || carregandoEdicao}>
                {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Salvar compra"}
              </Button>
            </div>
          </div>

          {blingNotaVinculada && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="flex items-center gap-2 pt-6 text-sm">
                <Link2 size={16} className="text-primary" />
                Lançando a entrada da nota Bling #{blingNotaVinculada.numero}. Importe o XML dessa
                nota abaixo pra preencher os itens - ao salvar, a compra fica vinculada e some da
                lista de pendentes em &quot;Notas do Bling&quot;.
              </CardContent>
            </Card>
          )}

          {pedidoCompraVinculado && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="flex items-center gap-2 pt-6 text-sm">
                <Link2 size={16} className="text-primary" />
                Essa entrada está referenciada ao Pedido de Compra PC.
                {String(pedidoCompraVinculado.numero).padStart(4, "0")}. Ao salvar, o pedido de compra fica
                marcado como &quot;atendido&quot;.
              </CardContent>
            </Card>
          )}

          {!pedidoCompraVinculado && pedidosCompraSugeridos.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="space-y-2 pt-6 text-sm">
                <p className="flex items-center gap-2">
                  <Link2 size={16} className="text-amber-500" />
                  Esse fornecedor tem pedido(s) de compra enviado(s) aguardando entrega - referenciar essa
                  compra a um deles?
                </p>
                <div className="flex flex-wrap gap-2">
                  {pedidosCompraSugeridos.map((pedido) => (
                    <Button
                      key={pedido.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPedidoCompraVinculado(pedido)
                        setPedidosCompraSugeridos([])
                      }}
                    >
                      Referenciar PC.{String(pedido.numero).padStart(4, "0")}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border p-3">
                <input
                  ref={inputXmlRef}
                  type="file"
                  accept=".xml"
                  className="hidden"
                  onChange={importarXml}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={importandoXml}
                  onClick={() => inputXmlRef.current?.click()}
                >
                  <FileUp size={16} className="mr-2" />
                  {importandoXml ? "Lendo XML..." : "Importar XML da NF-e"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Lê o XML que o fornecedor enviou e preenche fornecedor, número e itens
                  automaticamente. Não precisa de certificado digital - só leitura.
                </p>
              </div>
              {erroXml && <p className="text-sm text-red-500">{erroXml}</p>}
              {chaveXmlInvalida && (
                <p className="flex items-center gap-1.5 text-sm text-amber-500">
                  <Icone nome="alerta" tamanho={15} />
                  A chave de acesso deste XML não bateu na validação (dados podem estar
                  incompletos ou o arquivo alterado) - confira os valores antes de salvar.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid items-start gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <select
                  value={fornecedorId}
                  onChange={(e) => setFornecedorId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Selecione...</option>
                  {fornecedoresDisponiveis.map((f) => (
                    <option key={f.id} value={f.id}>
                      {rotuloFornecedor(f)}
                    </option>
                  ))}
                </select>
                {/* O cadastro criado pelo XML nasce so com o que a nota traz -
                    falta inscricao estadual, e-mail, contato e condicao de
                    pagamento. Sem esse aviso o fornecedor fica pela metade e
                    ninguem descobre ate precisar de um desses campos. */}
                {fornecedorCriadoPeloXml && (
                  <p className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
                    <Icone nome="alerta" tamanho={14} className="mr-1 inline-block align-text-bottom" />
                    <strong>{fornecedorCriadoPeloXml}</strong> foi cadastrado automaticamente com os
                    dados da nota. Confira o cadastro depois em Compras &gt; Fornecedores — a nota não
                    traz inscrição estadual, e-mail, contato nem condição de pagamento.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Número da nota
                  <CampoDica>Opcional - número da nota fiscal que o fornecedor emitiu.</CampoDica>
                </Label>
                <Input value={numeroNota} onChange={(e) => setNumeroNota(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>
                  Chave de acesso
                  <CampoDica>
                    Opcional - os 44 dígitos da chave da NF-e. Preenchido automaticamente ao
                    importar XML; em nota manual só preencha se tiver a chave em mãos.
                  </CampoDica>
                </Label>
                <Input
                  value={chaveAcesso}
                  onChange={(e) => setChaveAcesso(e.target.value.replace(/\D/g, "").slice(0, 44))}
                  maxLength={44}
                  inputMode="numeric"
                />
                {chaveAcesso.length === 44 && !validarChaveAcesso(chaveAcesso) && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-500">
                    <Icone nome="alerta" tamanho={13} />
                    Esses 44 dígitos não formam uma chave válida - confira antes de salvar.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Série
                  <CampoDica>
                    A numeração das notas é por série — dois fornecedores podem ter uma nota com o
                    mesmo número em séries diferentes. O contador confere por série.
                  </CampoDica>
                </Label>
                <Input value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label>
                  Data de emissão da nota
                  <CampoDica>
                    Data em que o fornecedor emitiu a nota — é o mês de competência, usado no
                    fechamento contábil. Diferente da data da compra, que é quando você lançou aqui.
                  </CampoDica>
                </Label>
                <Input
                  type="date"
                  value={dataEmissaoNota}
                  onChange={(e) => setDataEmissaoNota(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Valor total da nota (R$)
                  <CampoDica>
                    O valor que está impresso na nota. Pode ser diferente da soma dos itens mais o
                    frete quando há ST, IPI ou desconto — e é esse valor que o contador confere.
                  </CampoDica>
                </Label>
                <Input
                  inputMode="numeric"
                  value={valorTotalNota}
                  onChange={(e) => setValorTotalNota(mascaraMoeda(e.target.value))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Data da compra</Label>
                <Input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>
                  Vencimento
                  <CampoDica>
                    Prazo de pagamento, se o fornecedor der (30/60 dias etc). Vazio usa a data da compra.
                  </CampoDica>
                </Label>
                <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor do frete (R$)</Label>
                <Input
                  inputMode="numeric"
                  value={valorFrete}
                  onChange={(e) => setValorFrete(mascaraMoeda(e.target.value))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Observação</Label>
                <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {itensXmlPendentes.length > 0 && (
            <Card className="overflow-hidden border-amber-500/40 py-0">
              <div className="space-y-1 border-b border-slate-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium">
                  Itens da nota a vincular ({itensXmlPendentes.length})
                </p>
                <p className="text-xs text-muted-foreground">
                  Cada item precisa apontar para um produto do catálogo. O que não for vinculado não
                  entra na compra e não move estoque.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="cabecalho-grade border-b border-slate-700">
                      <th className="p-3 font-medium">Item da nota</th>
                      <th className="p-3 font-medium text-right">Qtd</th>
                      <th className="p-3 font-medium text-right">Custo un.</th>
                      <th className="p-3 font-medium">Produto no catálogo</th>
                      <th className="p-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensXmlPendentes.map((item, indice) => (
                      <tr
                        key={`${item.codigoFornecedor}-${indice}`}
                        className="border-b border-slate-200 align-top last:border-0"
                      >
                        <td className="p-3">
                          <p className="font-medium">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            Cód. no fornecedor: {item.codigoFornecedor || "-"}
                            {item.ncm ? ` · NCM ${item.ncm}` : ""}
                          </p>
                          <StatusVinculoItem item={item} origem={origemMapeamento[indice]} />
                        </td>
                        <td className="p-3 text-right">{item.quantidade}</td>
                        <td className="p-3 text-right">{formatarMoeda(item.valorUnitario)}</td>
                        <td className="p-3">
                          <select
                            value={mapeamentoXml[indice] ?? ""}
                            onChange={(e) =>
                              setMapeamentoXml((atual) => ({ ...atual, [indice]: e.target.value }))
                            }
                            className="flex h-9 w-full min-w-[220px] rounded-md border border-input bg-transparent px-3 text-sm"
                          >
                            <option value="">Vincular a qual produto?</option>
                            {produtosDisponiveis.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.codigo} - {p.nome}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            {!mapeamentoXml[indice] && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={cadastrandoProdutoIndice === indice}
                                onClick={() => cadastrarProdutoDoItem(indice)}
                                title="Cadastra um produto novo com a descrição, NCM, código de barras e custo desta nota"
                              >
                                {cadastrandoProdutoIndice === indice ? "Cadastrando..." : "Cadastrar produto"}
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!mapeamentoXml[indice]}
                              onClick={() => adicionarItemMapeado(indice)}
                            >
                              Vincular
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-medium">Itens da compra</p>

              <div className="grid gap-3 sm:grid-cols-[1fr_100px_140px_auto]">
                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Selecione o produto...</option>
                  {produtosDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nome} - estoque atual: {p.estoque}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="Qtd"
                />
                <Input
                  inputMode="numeric"
                  value={custoUnitario}
                  onChange={(e) => setCustoUnitario(mascaraMoeda(e.target.value))}
                  placeholder="Custo unit. (R$)"
                />
                <Button type="button" variant="outline" onClick={adicionarItem} disabled={!produtoId}>
                  Adicionar
                </Button>
              </div>

              {itens.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-3">Produto</th>
                        <th className="p-3">Qtd</th>
                        <th className="p-3">Produto un.</th>
                        <th className="p-3">Impostos e frete</th>
                        <th className="p-3">Custo real un.</th>
                        <th className="p-3">Subtotal</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item) => (
                        <tr key={item.produtoId} className="border-b border-border last:border-0 align-top">
                          <td className="p-3">{item.nome}</td>
                          <td className="p-3">{item.quantidade}</td>
                          <td className="p-3 text-slate-500">
                            {item.composicao ? formatarMoeda(item.composicao.valorProduto) : item.custoUnitario}
                          </td>
                          <td className="p-3">
                            <AcrescimosDoItem item={item} />
                          </td>
                          <td className="p-3 font-medium">{item.custoUnitario}</td>
                          <td className="p-3">
                            {formatarMoeda(item.quantidade * valorMoedaParaNumero(item.custoUnitario))}
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="icon-lg" onClick={() => removerItem(item.produtoId)}>
                              <Icone nome="excluir" tamanho={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {freteRateadoNosItens > 0 && (
                <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  O frete de {formatarMoeda(freteRateadoNosItens)} da nota já foi rateado entre os itens,
                  na proporção do valor de cada um, e está dentro do custo real acima. Por isso o campo
                  &quot;Valor do frete&quot; fica vazio — preenchê-lo cobraria o frete duas vezes.
                </p>
              )}

              <div className="flex justify-end gap-6 border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">Itens: {formatarMoeda(totalItens)}</span>
                <span className="text-muted-foreground">
                  Frete: {formatarMoeda(valorMoedaParaNumero(valorFrete || "0,00"))}
                </span>
                <span className="font-semibold">Total: {formatarMoeda(totalCompra)}</span>
              </div>

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas-bling" className="mt-4 space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-xs text-muted-foreground">
                Acompanha as notas de entrada já registradas no Bling (fornecedor emitiu, Sefaz
                autorizou). O lançamento no nosso sistema (dar entrada no estoque/custo) continua
                sendo feito importando o XML dessa nota em &quot;Cadastro&quot;.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {(["pendente", "lancada", "cancelada", "todas"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFiltroStatusBling(status)}
                    className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                      filtroStatusBling === status
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-input text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={buscarNotasBling}
                  disabled={carregandoNotasBling}
                  className="ml-auto"
                >
                  <RefreshCw size={14} className={`mr-2 ${carregandoNotasBling ? "animate-spin" : ""}`} />
                  {carregandoNotasBling ? "Consultando..." : "Atualizar"}
                </Button>
              </div>

              {erroNotasBling && <p className="text-sm text-red-500">{erroNotasBling}</p>}

              {notasBlingFiltradas.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {carregandoNotasBling ? "Consultando o Bling..." : "Nenhuma nota encontrada."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-slate-500">
                        <th className="p-3 font-medium">NF</th>
                        <th className="p-3 font-medium">Fornecedor</th>
                        <th className="p-3 font-medium">Emissão</th>
                        <th className="p-3 font-medium">Valor</th>
                        <th className="p-3 font-medium">Situação (Bling)</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notasBlingFiltradas.map((nota) => (
                        <tr key={nota.id} className="border-b border-border last:border-0">
                          <td className="p-3">
                            {nota.numero}/{nota.serie}
                          </td>
                          <td className="p-3">{nota.fornecedorNome || "-"}</td>
                          <td className="p-3 text-muted-foreground">
                            {nota.dataEmissao ? new Date(nota.dataEmissao).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="p-3">{formatarMoeda(nota.valorTotal)}</td>
                          <td className="p-3 text-muted-foreground">
                            {SITUACAO_BLING_LABEL[nota.situacao] ?? nota.situacao}
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                nota.statusLocal === "lancada"
                                  ? "selo-sucesso"
                                  : nota.statusLocal === "cancelada"
                                    ? "selo-neutro"
                                    : "selo-atencao"
                              }`}
                            >
                              {nota.statusLocal === "lancada"
                                ? "Lançada"
                                : nota.statusLocal === "cancelada"
                                  ? "Cancelada"
                                  : "Pendente"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {nota.statusLocal === "pendente" && (
                              <Button variant="outline" size="sm" onClick={() => lancarEntradaDeNotaBling(nota)}>
                                Lançar entrada
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModalDetalhe
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe ? `Compra - ${detalhe.fornecedor_nome}` : ""}
        campos={
          detalhe
            ? [
                { label: "Fornecedor", valor: detalhe.fornecedor_nome },
                { label: "CNPJ/CPF", valor: detalhe.fornecedor_cnpj_cpf },
                { label: "Número da nota", valor: detalhe.numero_nota },
                { label: "Chave de acesso", valor: detalhe.chave_acesso },
                { label: "Status", valor: STATUS_LABEL[detalhe.status] },
                {
                  label: "Pedido de compra",
                  valor: detalhe.pedido_compra_numero
                    ? `PC.${String(detalhe.pedido_compra_numero).padStart(4, "0")}`
                    : null,
                },
                { label: "Data da compra", valor: new Date(detalhe.data_compra).toLocaleDateString("pt-BR") },
                {
                  label: "Vencimento",
                  valor: detalhe.data_vencimento
                    ? new Date(detalhe.data_vencimento).toLocaleDateString("pt-BR")
                    : null,
                },
                { label: "Valor dos itens", valor: formatarMoeda(Number(detalhe.valor_itens)) },
                { label: "Frete", valor: formatarMoeda(Number(detalhe.valor_frete)) },
                {
                  label: "Total",
                  valor: formatarMoeda(Number(detalhe.valor_itens) + Number(detalhe.valor_frete)),
                },
                { label: "Observação", valor: detalhe.observacao },
              ]
            : []
        }
      />
    </div>
  )
}
