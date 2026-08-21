"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"
import { Printer, FileDown, RefreshCw } from "lucide-react"
import { formatarMoeda, mascaraCpfCnpj } from "@/lib/mascaras"
import { toast } from "sonner"
import type { NotaFiscalListada } from "@/lib/notas-fiscais"
import { Icone } from "@/components/admin/icone"
import { BarraStatusGrade } from "@/components/admin/barra-status-grade"
import { LinhaFiltros, CampoFiltro } from "@/components/admin/linha-filtros"

// Central de Notas Fiscais: entrada (compras) e saida (vendas) na mesma
// grade, cada linha com DANFE e XML. O ponto da tela e o cliente nao precisar
// abrir o Bling pra pegar um documento fiscal.
//
// Nao e uma tela de cadastro: nota fiscal nao se cria nem se edita aqui - ela
// nasce da importacao do XML (entrada) ou da emissao pelo Bling (saida). Por
// isso a barra tem Imprimir/Baixar/Atualizar no lugar de Novo/Editar/Excluir.

// Rota de cada acao por tipo de nota: entrada e saida moram em tabelas
// diferentes (TAB_COMPRA e TAB_PEDIDO), entao a URL muda junto.
function rotaDaNota(nota: NotaFiscalListada, acao: "danfe" | "xml") {
  const base = nota.tipo === "entrada" ? "compras" : "pedidos"
  return `/api/admin/${base}/${nota.id}/${acao}`
}

function formatarData(data: string | null) {
  if (!data) return "-"
  return new Date(`${data.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")
}

// A chave tem 44 digitos e ninguem le isso em bloco - o padrao dos sistemas
// fiscais (e do proprio DANFE) e quebrar de 4 em 4.
function formatarChave(chave: string | null) {
  if (!chave) return "-"
  return chave.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

export function NotasFiscaisConteudo({
  notasIniciais,
  fornecedores,
}: {
  notasIniciais: NotaFiscalListada[]
  fornecedores: { id: string; codigo: number; nome: string; cnpjCpf: string | null }[]
}) {
  const [notas, setNotas] = useState(notasIniciais)
  const [aba, setAba] = useState("todas")
  const [busca, setBusca] = useState("")
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")
  // Arquivo XML: "falta" acha o que ainda nao foi baixado do Bling e o
  // lancamento antigo de entrada que entrou na mao, sem arquivo - que sao
  // justamente as notas que faltam pro lote do contador ficar completo.
  // Vale nos dois sentidos de proposito: "ja salvo" responde "o que da pra
  // mandar agora?", que era impossivel de perguntar com o checkbox antigo.
  const [filtroXml, setFiltroXml] = useState("")
  const [fornecedorId, setFornecedorId] = useState("")
  const [marca, setMarca] = useState("")
  const [exportando, setExportando] = useState(false)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<NotaFiscalListada | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  const notasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return notas.filter((nota) => {
      if (aba !== "todas" && nota.tipo !== aba) return false
      if (filtroXml === "falta" && nota.temXml) return false
      if (filtroXml === "salvo" && !nota.temXml) return false
      if (fornecedorId && nota.fornecedorId !== fornecedorId) return false
      if (marca && nota.marca !== marca) return false

      // Comparacao de data como texto ("2026-08-19"), que e o formato que vem
      // do banco - evita fuso horario, que em data sem hora so atrapalha.
      if (dataInicial && (!nota.dataEmissao || nota.dataEmissao < dataInicial)) return false
      if (dataFinal && (!nota.dataEmissao || nota.dataEmissao > dataFinal)) return false

      if (!termo) return true
      return (
        (nota.numero ?? "").toLowerCase().includes(termo) ||
        (nota.participante ?? "").toLowerCase().includes(termo) ||
        (nota.chaveAcesso ?? "").includes(termo.replace(/\s/g, ""))
      )
    })
  }, [notas, aba, busca, dataInicial, dataFinal, filtroXml, fornecedorId, marca])

  // Atalho de competencia: e assim que o contador pensa o periodo ("agosto"),
  // e digitar duas datas so pra dizer "este mes" e trabalho a toa.
  function aplicarMes(mesesAtras: number) {
    const hoje = new Date()
    const primeiro = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, 1)
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras + 1, 0)
    setDataInicial(primeiro.toISOString().slice(0, 10))
    setDataFinal(ultimo.toISOString().slice(0, 10))
  }

  function limparFiltros() {
    setBusca("")
    setDataInicial("")
    setDataFinal("")
    setFiltroXml("")
    setFornecedorId("")
    setMarca("")
  }

  const temFiltro = Boolean(busca || dataInicial || dataFinal || filtroXml || fornecedorId || marca)

  // A linha e identificada por tipo+id: entrada e saida vem de tabelas
  // diferentes e nada impede que um id se repita entre elas.
  const chaveLinha = (nota: NotaFiscalListada) => `${nota.tipo}:${nota.id}`
  const notaSelecionada = notasFiltradas.find((nota) => chaveLinha(nota) === linhaSelecionada) ?? null

  // Lote do contador: entrada e saida do periodo, em pastas separadas dentro
  // do zip. Usa o periodo e os filtros que ja estao na tela - o que o operador
  // ve na grade e o que vai no arquivo, sem segunda janela de filtros pra
  // preencher de novo (e divergir).
  async function exportarParaContador() {
    if (!dataInicial || !dataFinal) {
      toast.error("Escolha o período de emissão antes de exportar (use \"Este mês\" ou \"Mês passado\").")
      return
    }

    setExportando(true)
    try {
      const resposta = await fetch("/api/admin/notas-fiscais/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inicio: dataInicial,
          fim: dataFinal,
          tipo: aba === "todas" ? "ambos" : aba,
          incluir: "xml",
          fornecedorId: fornecedorId || null,
          marca: marca || null,
        }),
      })

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null)
        toast.error(dados?.erro ?? "Não foi possível gerar o lote")
        return
      }

      const semXmlNoLote = Number(resposta.headers.get("X-Notas-Sem-Xml") ?? 0)
      const exportadas = resposta.headers.get("X-Notas-Exportadas") ?? "?"

      const url = URL.createObjectURL(await resposta.blob())
      const link = document.createElement("a")
      link.href = url
      link.download = `notas-fiscais-${dataInicial}-a-${dataFinal}.zip`
      link.click()
      URL.revokeObjectURL(url)

      if (semXmlNoLote > 0) {
        toast.warning(
          `${exportadas} nota(s) no arquivo. ${semXmlNoLote} nota(s) de saída ficaram de fora porque o XML ainda não foi baixado do Bling — exporte de novo em alguns instantes para trazer o restante.`,
          { duration: 12000 }
        )
      } else {
        toast.success(`${exportadas} nota(s) no arquivo.`)
      }
    } finally {
      setExportando(false)
    }
  }

  async function recarregar() {
    setAtualizando(true)
    try {
      const resposta = await fetch("/api/admin/notas-fiscais")
      if (!resposta.ok) throw new Error("Não foi possível atualizar a lista de notas")
      setNotas(await resposta.json())
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao atualizar as notas")
    } finally {
      setAtualizando(false)
    }
  }

  // O DANFE da saida pode precisar buscar o XML no Bling na primeira vez, e
  // ai a rota devolve JSON de erro em vez do PDF. Abrir numa aba nova sem
  // checar deixaria o cliente olhando uma aba com um JSON cru na tela.
  async function abrirDanfe(nota: NotaFiscalListada) {
    const resposta = await fetch(rotaDaNota(nota, "danfe"))
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null)
      toast.error(dados?.erro ?? "Não foi possível gerar o DANFE")
      return
    }
    const url = URL.createObjectURL(await resposta.blob())
    window.open(url, "_blank")
    // Libera o blob depois que o navegador teve tempo de abrir a aba.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  async function baixarXml(nota: NotaFiscalListada) {
    const resposta = await fetch(rotaDaNota(nota, "xml"))
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null)
      toast.error(dados?.erro ?? "Não foi possível baixar o XML")
      return
    }
    const url = URL.createObjectURL(await resposta.blob())
    const link = document.createElement("a")
    link.href = url
    link.download = `${nota.chaveAcesso || nota.numero || nota.id}-nfe.xml`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notas Fiscais</h1>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList>
          <TabsTrigger value="todas">
            <Icone nome="grade" tamanho={15} className="mr-1.5" />
            Todas
          </TabsTrigger>
          <TabsTrigger value="entrada">
            <Icone nome="baixar" tamanho={15} className="mr-1.5" />
            Entradas
          </TabsTrigger>
          <TabsTrigger value="saida">
            <Icone nome="enviar" tamanho={15} className="mr-1.5" />
            Saídas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={aba} className="mt-4">
          <Card className="overflow-hidden py-0">
            <BarraFerramentas
              botoes={[
                {
                  label: "DANFE",
                  icon: Printer,
                  onClick: () => notaSelecionada && abrirDanfe(notaSelecionada),
                  disabled: !notaSelecionada,
                  variante: "primary",
                  title: "Abrir o DANFE para visualizar e imprimir",
                },
                {
                  label: "XML",
                  icon: FileDown,
                  onClick: () => notaSelecionada && baixarXml(notaSelecionada),
                  disabled: !notaSelecionada,
                  title: "Baixar o XML autorizado da nota",
                },
                { separator: true },
                {
                  label: exportando ? "Gerando..." : "Contador",
                  icon: FileDown,
                  onClick: exportarParaContador,
                  disabled: exportando,
                  variante: "success",
                  title: "Baixar o lote de XMLs do período (entradas e saídas) para enviar ao contador",
                },
                { separator: true },
                {
                  label: "Atualizar",
                  icon: RefreshCw,
                  onClick: recarregar,
                  disabled: atualizando,
                },
              ]}
            />

            <LinhaFiltros aoLimpar={limparFiltros} temFiltro={temFiltro} encontrados={notasFiltradas.length}>
              <CampoFiltro rotulo="Buscar" largura="min-w-[240px] flex-1">
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Número, fornecedor/cliente ou chave de acesso"
                  className="h-9"
                />
              </CampoFiltro>

              <CampoFiltro rotulo="Emissão de">
                <Input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="h-9 w-[150px]"
                />
              </CampoFiltro>

              <CampoFiltro rotulo="até">
                <Input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="h-9 w-[150px]"
                />
              </CampoFiltro>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9" onClick={() => aplicarMes(0)}>
                  Este mês
                </Button>
                <Button variant="outline" size="sm" className="h-9" onClick={() => aplicarMes(1)}>
                  Mês passado
                </Button>
              </div>

              {/* Fornecedor so existe na entrada e loja so na saida - cada um
                  aparece quando a aba correspondente pode mostrar aquele tipo
                  de nota, pra nao oferecer filtro que nunca vai casar. */}
              {aba !== "saida" && (
                <CampoFiltro rotulo="Fornecedor">
                  <select
                    value={fornecedorId}
                    onChange={(e) => setFornecedorId(e.target.value)}
                    className="flex h-9 w-[190px] rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="">Todos</option>
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.codigo} - {fornecedor.nome}
                        {fornecedor.cnpjCpf ? ` - CNPJ: ${mascaraCpfCnpj(fornecedor.cnpjCpf)}` : ""}
                      </option>
                    ))}
                  </select>
                </CampoFiltro>
              )}

              {aba !== "entrada" && (
                <CampoFiltro rotulo="Loja">
                  <select
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="flex h-9 w-[170px] rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="">Todas</option>
                    <option value="colorido">Coisas Brasileiras</option>
                    <option value="branco">Porcelanas Brancas</option>
                  </select>
                </CampoFiltro>
              )}

              <CampoFiltro rotulo="Arquivo XML">
                <select
                  value={filtroXml}
                  onChange={(e) => setFiltroXml(e.target.value)}
                  title="O XML das notas de saída é baixado do Bling e fica salvo aqui. Este filtro mostra o que já está pronto para o contador e o que ainda falta."
                  className="flex h-9 w-[190px] rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">Todas</option>
                  <option value="salvo">Salvo — pronto para envio</option>
                  <option value="falta">Falta baixar do Bling</option>
                </select>
              </CampoFiltro>
            </LinhaFiltros>
            <CardContent className="p-0">
              {notasFiltradas.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  {temFiltro
                    ? "Nenhuma nota fiscal com esses filtros."
                    : "Nenhuma nota fiscal ainda."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-4 font-medium">Tipo</th>
                        <th className="p-4 font-medium">Número / Série</th>
                        <th className="p-4 font-medium">Emissão</th>
                        <th className="p-4 font-medium">Fornecedor / Cliente</th>
                        <th className="p-4 font-medium text-right">Valor</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notasFiltradas.map((nota) => (
                        <tr
                          key={chaveLinha(nota)}
                          onClick={() =>
                            setLinhaSelecionada((atual) =>
                              atual === chaveLinha(nota) ? null : chaveLinha(nota)
                            )
                          }
                          onDoubleClick={() => abrirDanfe(nota)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === chaveLinha(nota) ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                nota.tipo === "entrada"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {nota.tipo === "entrada" ? "Entrada" : "Saída"}
                            </span>
                          </td>
                          <td className="p-4 font-mono">
                            {nota.numero ?? "-"}
                            {nota.serie ? ` / ${nota.serie}` : ""}
                          </td>
                          <td className="p-4 text-slate-500">{formatarData(nota.dataEmissao)}</td>
                          <td className="p-4">{nota.participante ?? "-"}</td>
                          <td className="p-4 text-right">
                            {nota.valorTotal ? formatarMoeda(nota.valorTotal) : "-"}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              title="Ver detalhes"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(nota)
                              }}
                            >
                              <Icone nome="ver" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              title="Imprimir DANFE"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirDanfe(nota)
                              }}
                            >
                              <Icone nome="imprimir" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              title="Baixar XML"
                              onClick={(e) => {
                                e.stopPropagation()
                                baixarXml(nota)
                              }}
                            >
                              <Icone nome="baixar" tamanho={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <BarraStatusGrade exibidos={notasFiltradas.length} total={notas.length} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModalDetalhe
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe ? `Nota ${detalhe.numero ?? ""} / série ${detalhe.serie ?? "-"}` : ""}
        campos={
          detalhe
            ? [
                { label: "Tipo", valor: detalhe.tipo === "entrada" ? "Entrada" : "Saída" },
                { label: "Emissão", valor: formatarData(detalhe.dataEmissao) },
                {
                  label: detalhe.tipo === "entrada" ? "Fornecedor" : "Cliente",
                  valor: detalhe.participante ?? "-",
                },
                {
                  label: "Valor total",
                  valor: detalhe.valorTotal ? formatarMoeda(detalhe.valorTotal) : "-",
                },
                {
                  label: "Chave de acesso",
                  valor: <span className="font-mono text-sm">{formatarChave(detalhe.chaveAcesso)}</span>,
                },
                {
                  label: "XML guardado",
                  valor: detalhe.temXml ? "Sim" : "Ainda não baixado",
                },
              ]
            : []
        }
      />
    </div>
  )
}
