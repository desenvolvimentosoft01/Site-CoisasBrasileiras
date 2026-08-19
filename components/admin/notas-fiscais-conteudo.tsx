"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"
import { Printer, FileDown, RefreshCw } from "lucide-react"
import { formatarMoeda } from "@/lib/mascaras"
import { toast } from "sonner"
import type { NotaFiscalListada } from "@/lib/notas-fiscais"

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

export function NotasFiscaisConteudo({ notasIniciais }: { notasIniciais: NotaFiscalListada[] }) {
  const [notas, setNotas] = useState(notasIniciais)
  const [aba, setAba] = useState("todas")
  const [busca, setBusca] = useState("")
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<NotaFiscalListada | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  const notasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return notas.filter((nota) => {
      if (aba !== "todas" && nota.tipo !== aba) return false
      if (!termo) return true
      return (
        (nota.numero ?? "").toLowerCase().includes(termo) ||
        (nota.participante ?? "").toLowerCase().includes(termo) ||
        (nota.chaveAcesso ?? "").includes(termo.replace(/\s/g, ""))
      )
    })
  }, [notas, aba, busca])

  // A linha e identificada por tipo+id: entrada e saida vem de tabelas
  // diferentes e nada impede que um id se repita entre elas.
  const chaveLinha = (nota: NotaFiscalListada) => `${nota.tipo}:${nota.id}`
  const notaSelecionada = notasFiltradas.find((nota) => chaveLinha(nota) === linhaSelecionada) ?? null

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
            <span className="mr-1.5 text-sm leading-none">📋</span>
            Todas
          </TabsTrigger>
          <TabsTrigger value="entrada">
            <span className="mr-1.5 text-sm leading-none">📥</span>
            Entradas
          </TabsTrigger>
          <TabsTrigger value="saida">
            <span className="mr-1.5 text-sm leading-none">📤</span>
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
                  label: "Atualizar",
                  icon: RefreshCw,
                  onClick: recarregar,
                  disabled: atualizando,
                },
              ]}
              extra={
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por número, nome ou chave"
                  className="h-8 w-64"
                />
              }
            />
            <CardContent className="p-0">
              {notasFiltradas.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma nota fiscal encontrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
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
                              <span className="text-base leading-none">👁️</span>
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
                              <span className="text-base leading-none">🖨️</span>
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
                              <span className="text-base leading-none">📥</span>
                            </Button>
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
