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
import { Pencil, Trash2, Check, X as XIcon, ArrowRightCircle, FilePlus, Mail, MessageCircle, RefreshCw } from "lucide-react"
import { formatarMoeda } from "@/lib/mascaras"
import { OrcamentoForm, type OrcamentoExistente } from "@/components/admin/orcamento-form"
import { toast } from "sonner"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"
import { Icone } from "@/components/admin/icone"

export type Orcamento = {
  id: string
  numero: number
  titulo: string | null
  cliente_nome: string
  cliente_telefone: string | null
  cliente_email: string | null
  status: "aberto" | "aprovado" | "recusado" | "convertido"
  subtotal: string
  desconto: string
  total: string
  pedido_id: string | null
  token_aprovacao: string
  canal_resposta: "email" | "whatsapp" | null
  observacao_cliente: string | null
  enviado_email_em: string | null
  respondido_em: string | null
  criado_em: string
  marca: "colorido" | "branco"
}

function numeroFormatado(n: number) {
  return `OR.${String(n).padStart(4, "0")}`
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
  { valor: "cartao_credito", rotulo: "Cartão de crédito" },
  { valor: "cartao_debito", rotulo: "Cartão de débito" },
]

export function OrcamentosConteudo({ orcamentosIniciais }: { orcamentosIniciais: Orcamento[] }) {
  const confirmar = useConfirmar()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(orcamentosIniciais)
  const [aba, setAba] = useState("todos")
  const [filtroSite, setFiltroSite] = useState<"todos" | "colorido" | "branco">("todos")
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [editando, setEditando] = useState<OrcamentoExistente | undefined>(undefined)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [detalhe, setDetalhe] = useState<Orcamento | null>(null)

  const [orcamentoConvertendo, setOrcamentoConvertendo] = useState<Orcamento | null>(null)
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [convertendo, setConvertendo] = useState(false)
  const [erroConversao, setErroConversao] = useState("")
  const [enviandoEmailId, setEnviandoEmailId] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  async function recarregar() {
    const resposta = await fetch("/api/admin/orcamentos")
    setOrcamentos(await resposta.json())
  }

  async function atualizarStatusLista() {
    setAtualizando(true)
    await recarregar()
    setAtualizando(false)
  }

  function abrirNovo() {
    setEditando(undefined)
    setLinhaSelecionada(null)
    setMostrandoFormulario(true)
  }

  async function abrirEdicao(orcamento: Orcamento) {
    setLinhaSelecionada(orcamento.id)
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
      toast.error(dados.erro || "Erro ao atualizar status")
      return
    }
    recarregar()
  }

  function enviarPorWhatsapp(orcamento: Orcamento) {
    const numero = orcamento.cliente_telefone?.replace(/\D/g, "")
    if (!numero) {
      toast.error("Esse orçamento não tem telefone do cliente cadastrado")
      return
    }
    const numeroComDdi = numero.startsWith("55") ? numero : `55${numero}`
    const link = `${window.location.origin}/orcamento/aprovar/${orcamento.token_aprovacao}?canal=whatsapp`
    const mensagem = `Olá, ${orcamento.cliente_nome}! Segue o orçamento ${numeroFormatado(orcamento.numero)}${
      orcamento.titulo ? ` "${orcamento.titulo}"` : ""
    }.\n\nAcesse o link para ver os detalhes e aprovar ou recusar: ${link}`
    window.open(`https://wa.me/${numeroComDdi}?text=${encodeURIComponent(mensagem)}`, "_blank")
  }

  async function enviarPorEmail(orcamento: Orcamento) {
    if (!orcamento.cliente_email) {
      toast.error("Esse orçamento não tem e-mail do cliente cadastrado")
      return
    }
    setEnviandoEmailId(orcamento.id)
    const resposta = await fetch(`/api/admin/orcamentos/${orcamento.id}/enviar-email`, { method: "POST" })
    setEnviandoEmailId(null)
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao enviar o e-mail")
      return
    }
    toast.success(`Orçamento enviado para ${orcamento.cliente_email}!`)
    recarregar()
  }

  async function excluir(orcamento: Orcamento) {
    if (!(await confirmar({ descricao: `Excluir o orçamento #${orcamento.numero}?`, destrutivo: true, consequencia: "O orçamento e os itens dele são apagados, e o link enviado ao cliente para de funcionar." }))) return
    const resposta = await fetch(`/api/admin/orcamentos/${orcamento.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir")
      return
    }
    setLinhaSelecionada(null)
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

  const orcamentosFiltrados = orcamentos.filter(
    (o) => (aba === "todos" || o.status === aba) && (filtroSite === "todos" || o.marca === filtroSite)
  )
  const orcamentoSelecionado = orcamentos.find((o) => o.id === linhaSelecionada) ?? null

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
      <h1 className="text-2xl font-semibold">Orçamentos</h1>

      <Tabs value={filtroSite} onValueChange={(v) => setFiltroSite(v as typeof filtroSite)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="colorido">🎨 Coisas Brasileiras</TabsTrigger>
          <TabsTrigger value="branco">⚪ Porcelanas Brancas</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          {ABAS_STATUS.map((item) => {
            const orcamentosDoSite = orcamentos.filter((o) => filtroSite === "todos" || o.marca === filtroSite)
            const quantidade =
              item.valor === "todos"
                ? orcamentosDoSite.length
                : orcamentosDoSite.filter((o) => o.status === item.valor).length
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
          <Card className="overflow-hidden py-0">
            <BarraFerramentas
              botoes={[
                { label: "Novo", icon: FilePlus, onClick: abrirNovo, variante: "primary" },
                {
                  label: atualizando ? "Atualizando..." : "Atualizar",
                  icon: RefreshCw,
                  onClick: atualizarStatusLista,
                  disabled: atualizando,
                },
                {
                  label: "Editar",
                  icon: Pencil,
                  onClick: () => orcamentoSelecionado && abrirEdicao(orcamentoSelecionado),
                  disabled: !orcamentoSelecionado || orcamentoSelecionado.status !== "aberto",
                },
                {
                  label: "Converter em venda",
                  icon: ArrowRightCircle,
                  onClick: () => orcamentoSelecionado && setOrcamentoConvertendo(orcamentoSelecionado),
                  disabled: !orcamentoSelecionado || orcamentoSelecionado.status !== "aprovado",
                },
                {
                  label: "Enviar e-mail",
                  icon: Mail,
                  onClick: () => orcamentoSelecionado && enviarPorEmail(orcamentoSelecionado),
                  disabled:
                    !orcamentoSelecionado ||
                    orcamentoSelecionado.status !== "aberto" ||
                    enviandoEmailId === orcamentoSelecionado?.id,
                },
                {
                  label: "Enviar WhatsApp",
                  icon: MessageCircle,
                  onClick: () => orcamentoSelecionado && enviarPorWhatsapp(orcamentoSelecionado),
                  disabled: !orcamentoSelecionado || orcamentoSelecionado.status !== "aberto",
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => orcamentoSelecionado && excluir(orcamentoSelecionado),
                  disabled: !orcamentoSelecionado || orcamentoSelecionado.status === "convertido",
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {orcamentosFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhum orçamento encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-4 font-medium">Número</th>
                        <th className="p-4 font-medium">Cliente</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orcamentosFiltrados.map((orcamento) => (
                        <tr
                          key={orcamento.id}
                          onClick={() =>
                            setLinhaSelecionada((atual) => (atual === orcamento.id ? null : orcamento.id))
                          }
                          onDoubleClick={() => orcamento.status === "aberto" && abrirEdicao(orcamento)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === orcamento.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4 font-mono">OR.{String(orcamento.numero).padStart(4, "0")}</td>
                          <td className="p-4">
                            {orcamento.titulo && (
                              <p className="text-xs text-slate-400">{orcamento.titulo}</p>
                            )}
                            {orcamento.cliente_nome}{" "}
                            <span
                              className="text-xs"
                              title={orcamento.marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras"}
                            >
                              {orcamento.marca === "branco" ? "⚪" : "🎨"}
                            </span>
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
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(orcamento)
                              }}
                            >
                              <Icone nome="ver" tamanho={18} />
                            </Button>
                            {orcamento.status === "aberto" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    enviarPorWhatsapp(orcamento)
                                  }}
                                  title="Enviar por WhatsApp"
                                >
                                  <MessageCircle size={16} className="text-emerald-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    enviarPorEmail(orcamento)
                                  }}
                                  disabled={enviandoEmailId === orcamento.id}
                                  title="Enviar por e-mail"
                                >
                                  <Mail size={16} className="text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    abrirEdicao(orcamento)
                                  }}
                                >
                                  <Icone nome="editar" tamanho={18} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    alterarStatus(orcamento, "aprovado")
                                  }}
                                  title="Marcar como aprovado"
                                >
                                  <Check size={16} className="text-emerald-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    alterarStatus(orcamento, "recusado")
                                  }}
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOrcamentoConvertendo(orcamento)
                                }}
                                title="Converter em venda"
                              >
                                <ArrowRightCircle size={16} className="text-primary" />
                              </Button>
                            )}
                            {orcamento.status !== "convertido" && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  excluir(orcamento)
                                }}
                              >
                                <Icone nome="excluir" tamanho={18} />
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
            <DialogTitle>Converter orçamento em venda</DialogTitle>
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
              este orçamento como convertido.
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

      <ModalDetalhe
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe ? `OR.${String(detalhe.numero).padStart(4, "0")}` : ""}
        campos={
          detalhe
            ? [
                { label: "Título", valor: detalhe.titulo },
                { label: "Cliente", valor: detalhe.cliente_nome },
                { label: "Site", valor: detalhe.marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras" },
                { label: "Status", valor: detalhe.status },
                { label: "Subtotal", valor: formatarMoeda(detalhe.subtotal) },
                { label: "Desconto", valor: formatarMoeda(detalhe.desconto) },
                { label: "Total", valor: formatarMoeda(detalhe.total) },
                { label: "Data", valor: new Date(detalhe.criado_em).toLocaleDateString("pt-BR") },
                ...(detalhe.enviado_email_em
                  ? [{ label: "E-mail enviado em", valor: new Date(detalhe.enviado_email_em).toLocaleString("pt-BR") }]
                  : []),
                ...(detalhe.respondido_em
                  ? [
                      {
                        label: "Resposta do cliente",
                        valor: `${detalhe.status === "aprovado" ? "Aprovado" : "Recusado"} via ${
                          detalhe.canal_resposta === "whatsapp" ? "WhatsApp" : "e-mail"
                        } em ${new Date(detalhe.respondido_em).toLocaleString("pt-BR")}`,
                      },
                      ...(detalhe.observacao_cliente
                        ? [{ label: "Observação do cliente", valor: detalhe.observacao_cliente }]
                        : []),
                    ]
                  : []),
              ]
            : []
        }
      />
    </div>
  )
}
