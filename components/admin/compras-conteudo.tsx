"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { List, Plus, Trash2, PackageCheck, Ban, FileUp, AlertTriangle, Radio, RefreshCw, Link2 } from "lucide-react"
import { toast } from "sonner"
import { formatarMoeda, mascaraMoeda, valorMoedaParaNumero } from "@/lib/mascaras"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"

export type Fornecedor = { id: string; razao_social: string; cnpj_cpf: string | null }
export type ProdutoSelecionavel = {
  id: string
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

const SITUACAO_BLING_LABEL: Record<number, string> = {
  1: "Pendente",
  2: "Cancelada",
  3: "Aguardando recibo",
  4: "Rejeitada",
  5: "Autorizada",
  6: "Emitida DANFE",
  7: "Registrada",
  8: "Aguardando protocolo",
  9: "Denegada",
  10: "Consulta situacao",
  11: "Bloqueada",
}

type ItemNfeXml = {
  codigoFornecedor: string
  codigoBarras: string | null
  descricao: string
  ncm: string | null
  quantidade: number
  valorUnitario: number
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
  valorFrete: number
  valorTotal: number
}

export type Compra = {
  id: string
  numero_nota: string | null
  status: "pendente" | "recebida" | "cancelada"
  valor_frete: string
  data_compra: string
  criado_em: string
  fornecedor_nome: string
  valor_itens: string
}

type ItemCarrinho = { produtoId: string; nome: string; quantidade: number; custoUnitario: string }

const STATUS_ESTILO: Record<Compra["status"], string> = {
  pendente: "bg-amber-500/20 text-amber-500",
  recebida: "bg-emerald-600/20 text-emerald-400",
  cancelada: "bg-slate-200 text-slate-500",
}

const STATUS_LABEL: Record<Compra["status"], string> = {
  pendente: "Pendente",
  recebida: "Recebida",
  cancelada: "Cancelada",
}

export function ComprasConteudo({
  comprasIniciais,
  fornecedores,
  produtos,
}: {
  comprasIniciais: Compra[]
  fornecedores: Fornecedor[]
  produtos: ProdutoSelecionavel[]
}) {
  const confirmar = useConfirmar()
  const [compras, setCompras] = useState<Compra[]>(comprasIniciais)
  const [fornecedoresDisponiveis, setFornecedoresDisponiveis] = useState<Fornecedor[]>(fornecedores)
  const [aba, setAba] = useState("lista")

  const [importandoXml, setImportandoXml] = useState(false)
  const [erroXml, setErroXml] = useState("")
  const [chaveXmlInvalida, setChaveXmlInvalida] = useState(false)
  const [itensXmlPendentes, setItensXmlPendentes] = useState<ItemNfeXml[]>([])
  const [mapeamentoXml, setMapeamentoXml] = useState<Record<number, string>>({})
  const inputXmlRef = useRef<HTMLInputElement>(null)

  const [fornecedorId, setFornecedorId] = useState("")
  const [numeroNota, setNumeroNota] = useState("")
  const [dataCompra, setDataCompra] = useState(() => new Date().toISOString().slice(0, 10))
  const [dataVencimento, setDataVencimento] = useState("")
  const [valorFrete, setValorFrete] = useState("")
  const [observacao, setObservacao] = useState("")
  const [itens, setItens] = useState<ItemCarrinho[]>([])

  const [produtoId, setProdutoId] = useState("")
  const [quantidade, setQuantidade] = useState("1")
  const [custoUnitario, setCustoUnitario] = useState("")

  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [processandoId, setProcessandoId] = useState<string | null>(null)

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
    setFornecedorId("")
    setNumeroNota("")
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
    setAba("formulario")
  }

  function adicionarItem() {
    const produto = produtos.find((p) => p.id === produtoId)
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

    const cnpjEmitente = dados.emitente.cnpj
    const fornecedorExistente = fornecedoresDisponiveis.find(
      (f) => f.cnpj_cpf?.replace(/\D/g, "") === cnpjEmitente
    )

    if (fornecedorExistente) {
      setFornecedorId(fornecedorExistente.id)
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
        registrarAuditoria({
          tela: "Compras (importacao XML)",
          acao: "cadastro",
          tabela: "TAB_FORNECEDOR",
          registroId: novoFornecedor.id,
          depois: { razao_social: novoFornecedor.razao_social, cnpj_cpf: novoFornecedor.cnpj_cpf },
        })
      }
    }

    if (dados.numero) setNumeroNota(dados.numero)
    if (dados.dataEmissao) setDataCompra(dados.dataEmissao)
    if (dados.valorFrete > 0) {
      setValorFrete(mascaraMoeda(String(Math.round(dados.valorFrete * 100))))
    }

    setItensXmlPendentes(dados.itens)
    // Pre-seleciona por codigo de barras (mais confiavel, o EAN e o mesmo
    // em qualquer lugar) e cai pro SKU se nao achar - o admin ainda confirma
    // (ou troca) cada item antes de adicionar.
    const mapeamentoInicial: Record<number, string> = {}
    dados.itens.forEach((item, indice) => {
      const produtoPorCodigoBarras =
        item.codigoBarras && produtos.find((p) => p.codigo_barras && p.codigo_barras === item.codigoBarras)
      const produtoPorSku = produtos.find((p) => p.sku && p.sku === item.codigoFornecedor)
      const encontrado = produtoPorCodigoBarras || produtoPorSku
      if (encontrado) mapeamentoInicial[indice] = encontrado.id
    })
    setMapeamentoXml(mapeamentoInicial)
  }

  function adicionarItemMapeado(indice: number) {
    const itemXml = itensXmlPendentes[indice]
    const produtoIdSelecionado = mapeamentoXml[indice]
    const produto = produtos.find((p) => p.id === produtoIdSelecionado)
    if (!itemXml || !produto) return

    setItens((atual) => [
      ...atual,
      {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: itemXml.quantidade || 1,
        custoUnitario: mascaraMoeda(String(Math.round(itemXml.valorUnitario * 100))),
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

    setSalvando(true)

    const resposta = await fetch("/api/admin/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fornecedorId,
        numeroNota: numeroNota || null,
        valorFrete: valorMoedaParaNumero(valorFrete || "0,00"),
        dataCompra,
        dataVencimento: dataVencimento || null,
        observacao: observacao || null,
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          custoUnitario: valorMoedaParaNumero(i.custoUnitario),
        })),
        blingNotaId: blingNotaVinculada?.id || null,
      }),
    })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    const salva = await resposta.json()
    registrarAuditoria({
      tela: "Compras",
      acao: "cadastro",
      tabela: "TAB_COMPRA",
      registroId: salva.id,
      depois: { fornecedor_id: fornecedorId, itens: itens.length },
    })

    setAba("lista")
    recarregar()
  }

  async function receber(compra: Compra) {
    if (!(await confirmar(`Confirmar o recebimento da compra de "${compra.fornecedor_nome}"? Isso vai dar alta no estoque, atualizar o custo dos produtos e gerar uma conta a pagar.`))) return

    setProcessandoId(compra.id)
    const resposta = await fetch(`/api/admin/compras/${compra.id}/receber`, { method: "POST" })
    setProcessandoId(null)

    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao receber compra")
      return
    }

    registrarAuditoria({
      tela: "Compras",
      acao: "edicao",
      tabela: "TAB_COMPRA",
      registroId: compra.id,
      antes: { status: "pendente" },
      depois: { status: "recebida" },
    })
    recarregar()
  }

  async function cancelar(compra: Compra) {
    if (!(await confirmar({ descricao: `Cancelar a compra de "${compra.fornecedor_nome}"?`, destrutivo: true }))) return

    setProcessandoId(compra.id)
    const resposta = await fetch(`/api/admin/compras/${compra.id}/cancelar`, { method: "POST" })
    setProcessandoId(null)

    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao cancelar compra")
      return
    }

    registrarAuditoria({
      tela: "Compras",
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
      <h1 className="text-2xl font-semibold">Compras</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lista">
              <List size={14} className="mr-1.5" />
              Grade
            </TabsTrigger>
            <TabsTrigger value="formulario">
              <Plus size={14} className="mr-1.5" />
              Cadastro
            </TabsTrigger>
            <TabsTrigger value="notas-bling" onClick={() => notasBling.length === 0 && buscarNotasBling()}>
              <Radio size={14} className="mr-1.5" />
              Notas do Bling
            </TabsTrigger>
          </TabsList>
          {aba === "lista" && (
            <Button onClick={abrirNova}>
              <Plus size={16} className="mr-2" />
              Nova compra
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {compras.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma compra cadastrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Fornecedor</th>
                        <th className="p-4 font-medium">NF</th>
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compras.map((compra) => (
                        <tr key={compra.id} className="border-b border-slate-200 last:border-0">
                          <td className="p-4 font-medium">{compra.fornecedor_nome}</td>
                          <td className="p-4 text-slate-500">{compra.numero_nota || "-"}</td>
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
                            {compra.status === "pendente" && (
                              <>
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
            <span className="text-sm font-medium text-muted-foreground">Nova compra</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAba("lista")}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar compra"}
              </Button>
            </div>
          </div>

          {blingNotaVinculada && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="flex items-center gap-2 pt-6 text-sm">
                <Link2 size={16} className="text-primary" />
                Lançando a entrada da nota Bling #{blingNotaVinculada.numero}. Importe o XML dessa
                nota abaixo pra preencher os itens - ao salvar, a compra fica vinculada e some da
                lista de pendentes em "Notas do Bling".
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
                  Le o XML que o fornecedor enviou e preenche fornecedor, numero e itens
                  automaticamente. Nao precisa de certificado digital - so leitura.
                </p>
              </div>
              {erroXml && <p className="text-sm text-red-500">{erroXml}</p>}
              {chaveXmlInvalida && (
                <p className="flex items-center gap-1.5 text-sm text-amber-500">
                  <AlertTriangle size={14} />
                  A chave de acesso deste XML nao bateu na validacao (dados podem estar
                  incompletos ou o arquivo alterado) - confira os valores antes de salvar.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
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
                      {f.razao_social}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Numero da nota (opcional)</Label>
                <Input value={numeroNota} onChange={(e) => setNumeroNota(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data da compra</Label>
                <Input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento (prazo de pagamento)</Label>
                <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Se o fornecedor der prazo (30/60 dias etc). Vazio usa a data da compra.
                </p>
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
                <Label>Observacao</Label>
                <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {itensXmlPendentes.length > 0 && (
            <Card className="border-amber-500/40">
              <CardContent className="space-y-3 pt-6">
                <p className="text-sm font-medium">
                  Itens do XML pendentes de mapeamento ({itensXmlPendentes.length})
                </p>
                <p className="text-xs text-muted-foreground">
                  Associe cada item da nota a um produto do catalogo e clique em "Adicionar" -
                  itens nao mapeados nao entram na compra.
                </p>
                <div className="space-y-2">
                  {itensXmlPendentes.map((item, indice) => (
                    <div
                      key={`${item.codigoFornecedor}-${indice}`}
                      className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
                    >
                      <div className="text-sm">
                        <p className="font-medium">{item.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          Cod. fornecedor: {item.codigoFornecedor || "-"} · Qtd: {item.quantidade} ·{" "}
                          {formatarMoeda(item.valorUnitario)}/un
                        </p>
                      </div>
                      <select
                        value={mapeamentoXml[indice] ?? ""}
                        onChange={(e) =>
                          setMapeamentoXml((atual) => ({ ...atual, [indice]: e.target.value }))
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                      >
                        <option value="">Mapear pra qual produto?</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} {p.sku ? `(${p.sku})` : ""}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!mapeamentoXml[indice]}
                        onClick={() => adicionarItemMapeado(indice)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
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
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} {p.sku ? `(${p.sku})` : ""} - estoque atual: {p.estoque}
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
                      <tr className="border-b border-border text-left text-slate-500">
                        <th className="p-3 font-medium">Produto</th>
                        <th className="p-3 font-medium">Qtd</th>
                        <th className="p-3 font-medium">Custo unit.</th>
                        <th className="p-3 font-medium">Subtotal</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item) => (
                        <tr key={item.produtoId} className="border-b border-border last:border-0">
                          <td className="p-3">{item.nome}</td>
                          <td className="p-3">{item.quantidade}</td>
                          <td className="p-3">{item.custoUnitario}</td>
                          <td className="p-3">
                            {formatarMoeda(item.quantidade * valorMoedaParaNumero(item.custoUnitario))}
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="icon-lg" onClick={() => removerItem(item.produtoId)}>
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                Acompanha as notas de entrada ja registradas no Bling (fornecedor emitiu, Sefaz
                autorizou). O lancamento no nosso sistema (dar entrada no estoque/custo) continua
                sendo feito importando o XML dessa nota em "Cadastro".
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
                        <th className="p-3 font-medium">Emissao</th>
                        <th className="p-3 font-medium">Valor</th>
                        <th className="p-3 font-medium">Situacao (Bling)</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium text-right">Acoes</th>
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
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : nota.statusLocal === "cancelada"
                                    ? "bg-slate-200 text-slate-500"
                                    : "bg-amber-500/20 text-amber-500"
                              }`}
                            >
                              {nota.statusLocal === "lancada"
                                ? "Lancada"
                                : nota.statusLocal === "cancelada"
                                  ? "Cancelada"
                                  : "Pendente"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {nota.statusLocal === "pendente" && (
                              <Button variant="outline" size="sm" onClick={() => lancarEntradaDeNotaBling(nota)}>
                                Lancar entrada
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
    </div>
  )
}
