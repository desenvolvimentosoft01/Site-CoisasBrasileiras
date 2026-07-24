"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Check, X as XIcon, ArrowRightCircle } from "lucide-react"
import { formatarMoeda } from "@/lib/mascaras"
import { OrcamentoForm, type OrcamentoExistente } from "@/components/admin/orcamento-form"

export type Orcamento = {
  id: string
  numero: number
  titulo: string | null
  cliente_nome: string
  status: "aberto" | "aprovado" | "recusado" | "convertido"
  subtotal: string
  desconto: string
  total: string
  pedido_id: string | null
  criado_em: string
}

const ABAS_STATUS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aberto", rotulo: "Em aberto" },
  { valor: "aprovado", rotulo: "Aprovados" },
  { valor: "recusado", rotulo: "Recusados" },
  { valor: "convertido", rotulo: "Convertidos" },
]

const CORES_STATUS: Record<Orcamento["status"], string> = {
  aberto: "bg-blue-600/20 text-blue-400",
  aprovado: "bg-emerald-600/20 text-emerald-400",
  recusado: "bg-red-600/20 text-red-400",
  convertido: "bg-slate-200 text-slate-400",
}

const FORMAS_PAGAMENTO = [
  { valor: "dinheiro", rotulo: "Dinheiro" },
  { valor: "pix", rotulo: "Pix" },
  { valor: "cartao_credito", rotulo: "Cartao de credito" },
  { valor: "cartao_debito", rotulo: "Cartao de debito" },
]

export function OrcamentosConteudo({ orcamentosIniciais }: { orcamentosIniciais: Orcamento[] }) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(orcamentosIniciais)
  const [aba, setAba] = useState("todos")
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [editando, setEditando] = useState<OrcamentoExistente | undefined>(undefined)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)

  const [orcamentoConvertendo, setOrcamentoConvertendo] = useState<Orcamento | null>(null)
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [convertendo, setConvertendo] = useState(false)
  const [erroConversao, setErroConversao] = useState("")

  async function recarregar() {
    const resposta = await fetch("/api/admin/orcamentos")
    setOrcamentos(await resposta.json())
  }

  function abrirNovo() {
    setEditando(undefined)
    setMostrandoFormulario(true)
  }

  async function abrirEdicao(orcamento: Orcamento) {
    setMostrandoFormulario(true)
    setCarregandoDetalhe(true)
    const resposta = await fetch(`/api/admin/orcamentos/${orcamento.id}`)
    setEditando(await resposta.json())
    setCarregandoDetalhe(false)
  }

  function handleSalvo() {
    setMostrandoFormulario(false)
    setEditando(undefined)
    recarregar()
  }

  async function alterarStatus(orcamento: Orcamento, status: "aprovado" | "recusado" | "aberto") {
    const resposta = await fetch(`/api/admin/orcamentos/${orcamento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!resposta.ok) {
      const dados = await resposta.json()
      alert(dados.erro || "Erro ao atualizar status")
      return
    }
    recarregar()
  }

  async function excluir(orcamento: Orcamento) {
    if (!confirm(`Excluir o orcamento #${orcamento.numero}?`)) return
    const resposta = await fetch(`/api/admin/orcamentos/${orcamento.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      alert(dados.erro || "Erro ao excluir")
      return
    }
    recarregar()
  }

  async function converter() {
    if (!orcamentoConvertendo) return
    setErroConversao("")
    setConvertendo(true)

    const resposta = await fetch(`/api/admin/orcamentos/${orcamentoConvertendo.id}/converter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formaPagamento }),
    })

    setConvertendo(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErroConversao(dados.erro || "Erro ao converter em venda")
      return
    }

    setOrcamentoConvertendo(null)
    recarregar()
  }

  const orcamentosFiltrados = aba === "todos" ? orcamentos : orcamentos.filter((o) => o.status === aba)

  if (mostrandoFormulario) {
    return carregandoDetalhe ? (
      <p className="text-sm text-slate-500">Carregando...</p>
    ) : (
      <OrcamentoForm
        key={editando?.id ?? "novo"}
        orcamento={editando}
        onSalvo={handleSalvo}
        onCancelar={() => setMostrandoFormulario(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orcamentos</h1>
        <Button onClick={abrirNovo}>
          <Plus size={16} className="mr-2" />
          Novo orcamento
        </Button>
      </div>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          {ABAS_STATUS.map((item) => {
            const quantidade =
              item.valor === "todos" ? orcamentos.length : orcamentos.filter((o) => o.status === item.valor).length
            return (
              <TabsTrigger key={item.valor} value={item.valor} className="flex-none px-3">
                {item.rotulo}
                {quantidade > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-xs text-slate-400">
                    {quantidade}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={aba} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {orcamentosFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhum orcamento encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Numero</th>
                        <th className="p-4 font-medium">Cliente</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orcamentosFiltrados.map((orcamento) => (
                        <tr key={orcamento.id} className="border-b border-slate-200 last:border-0">
                          <td className="p-4 font-mono">OR.{String(orcamento.numero).padStart(4, "0")}</td>
                          <td className="p-4">
                            {orcamento.titulo && (
                              <p className="text-xs text-slate-400">{orcamento.titulo}</p>
                            )}
                            {orcamento.cliente_nome}
                          </td>
                          <td className="p-4">
                            <span className={`rounded-full px-2 py-1 text-xs ${CORES_STATUS[orcamento.status]}`}>
                              {orcamento.status}
                            </span>
                          </td>
                          <td className="p-4">{formatarMoeda(orcamento.total)}</td>
                          <td className="p-4 text-slate-500">
                            {new Date(orcamento.criado_em).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-4 text-right">
                            {orcamento.status === "aberto" && (
                              <>
                                <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(orcamento)}>
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  onClick={() => alterarStatus(orcamento, "aprovado")}
                                  title="Marcar como aprovado"
                                >
                                  <Check size={16} className="text-emerald-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  onClick={() => alterarStatus(orcamento, "recusado")}
                                  title="Marcar como recusado"
                                >
                                  <XIcon size={16} className="text-red-500" />
                                </Button>
                              </>
                            )}
                            {orcamento.status === "aprovado" && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={() => setOrcamentoConvertendo(orcamento)}
                                title="Converter em venda"
                              >
                                <ArrowRightCircle size={16} className="text-primary" />
                              </Button>
                            )}
                            {orcamento.status !== "convertido" && (
                              <Button variant="ghost" size="icon-lg" onClick={() => excluir(orcamento)}>
                                <Trash2 size={16} className="text-red-500" />
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

      <Dialog
        open={!!orcamentoConvertendo}
        onOpenChange={(aberto) => !aberto && setOrcamentoConvertendo(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter orcamento em venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {orcamentoConvertendo && (
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatarMoeda(orcamentoConvertendo.total)}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v || "dinheiro")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <SelectItem key={forma.valor} value={forma.valor}>
                      {forma.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Isso vai gerar uma venda (baixando o estoque dos itens vinculados a produtos) e marcar
              este orcamento como convertido.
            </p>

            {erroConversao && <p className="text-sm text-red-500">{erroConversao}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrcamentoConvertendo(null)}>
              Cancelar
            </Button>
            <Button onClick={converter} disabled={convertendo}>
              {convertendo ? "Convertendo..." : "Confirmar venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
