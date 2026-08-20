"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Pencil, Trash2, FilePlus, Mail, Ban, RefreshCw, ArrowRightCircle, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatarMoeda } from "@/lib/mascaras"
import {
  PedidoCompraForm,
  type Fornecedor,
  type ProdutoDisponivel,
  type PedidoCompraExistente,
} from "@/components/admin/pedido-compra-form"
import { toast } from "sonner"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"

export type PedidoCompra = {
  id: string
  numero: number
  status: "aberto" | "enviado" | "atendido" | "cancelado"
  observacao: string | null
  valor_total: string
  desconto: string
  enviado_email_em: string | null
  criado_em: string
  fornecedor_id: string
  fornecedor_nome: string
  fornecedor_email: string | null
  fornecedor_telefone: string | null
}

const ABAS_STATUS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aberto", rotulo: "Em aberto" },
  { valor: "enviado", rotulo: "Enviados" },
  { valor: "atendido", rotulo: "Atendidos" },
  { valor: "cancelado", rotulo: "Cancelados" },
]

const CORES_STATUS: Record<PedidoCompra["status"], string> = {
  aberto: "bg-blue-600/20 text-blue-400",
  enviado: "bg-amber-500/20 text-amber-500",
  atendido: "bg-emerald-600/20 text-emerald-400",
  cancelado: "bg-slate-200 text-slate-400",
}

const STATUS_LABEL: Record<PedidoCompra["status"], string> = {
  aberto: "Aberto",
  enviado: "Enviado",
  atendido: "Atendido",
  cancelado: "Cancelado",
}

function numeroFormatado(n: number) {
  return `PC.${String(n).padStart(4, "0")}`
}

export function PedidosCompraConteudo({
  pedidosIniciais,
  fornecedores,
  produtos,
}: {
  pedidosIniciais: PedidoCompra[]
  fornecedores: Fornecedor[]
  produtos: ProdutoDisponivel[]
}) {
  const confirmar = useConfirmar()
  const router = useRouter()
  const [pedidos, setPedidos] = useState<PedidoCompra[]>(pedidosIniciais)
  const [aba, setAba] = useState("todos")
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [editando, setEditando] = useState<PedidoCompraExistente | undefined>(undefined)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [detalhe, setDetalhe] = useState<PedidoCompra | null>(null)
  const [enviandoEmailId, setEnviandoEmailId] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  async function recarregar() {
    const resposta = await fetch("/api/admin/pedidos-compra")
    setPedidos(await resposta.json())
  }

  async function atualizarLista() {
    setAtualizando(true)
    await recarregar()
    setAtualizando(false)
  }

  function abrirNovo() {
    setEditando(undefined)
    setLinhaSelecionada(null)
    setMostrandoFormulario(true)
  }

  async function abrirEdicao(pedido: PedidoCompra) {
    setLinhaSelecionada(pedido.id)
    setMostrandoFormulario(true)
    setCarregandoDetalhe(true)
    const resposta = await fetch(`/api/admin/pedidos-compra/${pedido.id}`)
    setEditando(await resposta.json())
    setCarregandoDetalhe(false)
  }

  function handleSalvo() {
    setMostrandoFormulario(false)
    setEditando(undefined)
    recarregar()
  }

  async function enviarPorEmail(pedido: PedidoCompra) {
    if (!pedido.fornecedor_email) {
      toast.error("Esse fornecedor não tem e-mail cadastrado")
      return
    }
    setEnviandoEmailId(pedido.id)
    const resposta = await fetch(`/api/admin/pedidos-compra/${pedido.id}/enviar-email`, { method: "POST" })
    setEnviandoEmailId(null)
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao enviar o e-mail")
      return
    }
    toast.success(`Pedido de compra enviado para ${pedido.fornecedor_email}!`)
    recarregar()
  }

  function lancarEntrada(pedido: PedidoCompra) {
    router.push(`/admin/compras?pedidoCompraId=${pedido.id}`)
  }

  async function enviarPorWhatsapp(pedido: PedidoCompra) {
    const numero = pedido.fornecedor_telefone?.replace(/\D/g, "")
    if (!numero) {
      toast.error("Esse fornecedor não tem telefone cadastrado")
      return
    }
    const resposta = await fetch(`/api/admin/pedidos-compra/${pedido.id}`)
    const detalhe = await resposta.json()

    const numeroComDdi = numero.startsWith("55") ? numero : `55${numero}`
    const linhasItens = detalhe.itens
      .map((i: { descricao: string; quantidade: string; custo_unitario: string }) => `${i.quantidade}x ${i.descricao}`)
      .join("\n")
    const mensagem = `Olá, ${pedido.fornecedor_nome}! Segue o pedido de compra ${numeroFormatado(pedido.numero)}:\n\n${linhasItens}\n\nTotal estimado: ${formatarMoeda(pedido.valor_total)}${
      pedido.observacao ? `\n\nObs: ${pedido.observacao}` : ""
    }`
    window.open(`https://wa.me/${numeroComDdi}?text=${encodeURIComponent(mensagem)}`, "_blank")

    if (pedido.status === "aberto") {
      await fetch(`/api/admin/pedidos-compra/${pedido.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "enviado" }),
      }).catch(() => {})
      recarregar()
    }
  }

  async function cancelar(pedido: PedidoCompra) {
    if (!(await confirmar({ descricao: `Cancelar o pedido de compra ${numeroFormatado(pedido.numero)}?`, destrutivo: true, consequencia: "O pedido fica marcado como cancelado e não pode mais receber entrada de nota. O fornecedor não é avisado automaticamente." })))
      return
    const resposta = await fetch(`/api/admin/pedidos-compra/${pedido.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelado" }),
    })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao cancelar")
      return
    }
    recarregar()
  }

  async function excluir(pedido: PedidoCompra) {
    if (!(await confirmar({ descricao: `Excluir o pedido de compra ${numeroFormatado(pedido.numero)}?`, destrutivo: true, consequencia: "O pedido e os itens dele são apagados do sistema." })))
      return
    const resposta = await fetch(`/api/admin/pedidos-compra/${pedido.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir")
      return
    }
    setLinhaSelecionada(null)
    recarregar()
  }

  const pedidosFiltrados = aba === "todos" ? pedidos : pedidos.filter((p) => p.status === aba)
  const pedidoSelecionado = pedidos.find((p) => p.id === linhaSelecionada) ?? null

  if (mostrandoFormulario) {
    return carregandoDetalhe ? (
      <p className="text-sm text-slate-500">Carregando...</p>
    ) : (
      <PedidoCompraForm
        key={editando?.id ?? "novo"}
        pedido={editando}
        fornecedores={fornecedores}
        produtosDisponiveis={produtos}
        onSalvo={handleSalvo}
        onCancelar={() => setMostrandoFormulario(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pedido de Compra</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          {ABAS_STATUS.map((item) => {
            const quantidade =
              item.valor === "todos" ? pedidos.length : pedidos.filter((p) => p.status === item.valor).length
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
                  onClick: atualizarLista,
                  disabled: atualizando,
                },
                {
                  label: "Editar",
                  icon: Pencil,
                  onClick: () => pedidoSelecionado && abrirEdicao(pedidoSelecionado),
                  disabled: !pedidoSelecionado || pedidoSelecionado.status !== "aberto",
                },
                {
                  label: "Enviar e-mail",
                  icon: Mail,
                  onClick: () => pedidoSelecionado && enviarPorEmail(pedidoSelecionado),
                  disabled:
                    !pedidoSelecionado ||
                    pedidoSelecionado.status === "atendido" ||
                    pedidoSelecionado.status === "cancelado" ||
                    enviandoEmailId === pedidoSelecionado?.id,
                },
                {
                  label: "Enviar WhatsApp",
                  icon: MessageCircle,
                  onClick: () => pedidoSelecionado && enviarPorWhatsapp(pedidoSelecionado),
                  disabled:
                    !pedidoSelecionado ||
                    pedidoSelecionado.status === "atendido" ||
                    pedidoSelecionado.status === "cancelado",
                },
                {
                  label: "Lançar entrada",
                  icon: ArrowRightCircle,
                  onClick: () => pedidoSelecionado && lancarEntrada(pedidoSelecionado),
                  disabled: !pedidoSelecionado || pedidoSelecionado.status !== "enviado",
                },
                {
                  label: "Cancelar",
                  icon: Ban,
                  onClick: () => pedidoSelecionado && cancelar(pedidoSelecionado),
                  disabled:
                    !pedidoSelecionado ||
                    pedidoSelecionado.status === "atendido" ||
                    pedidoSelecionado.status === "cancelado",
                  variante: "danger",
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => pedidoSelecionado && excluir(pedidoSelecionado),
                  disabled: !pedidoSelecionado || pedidoSelecionado.status === "atendido",
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {pedidosFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhum pedido de compra encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Número</th>
                        <th className="p-4 font-medium">Fornecedor</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map((pedido) => (
                        <tr
                          key={pedido.id}
                          onClick={() => setLinhaSelecionada((atual) => (atual === pedido.id ? null : pedido.id))}
                          onDoubleClick={() => pedido.status === "aberto" && abrirEdicao(pedido)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === pedido.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4 font-mono">{numeroFormatado(pedido.numero)}</td>
                          <td className="p-4">{pedido.fornecedor_nome}</td>
                          <td className="p-4">
                            <span className={`rounded-full px-2 py-1 text-xs ${CORES_STATUS[pedido.status]}`}>
                              {STATUS_LABEL[pedido.status]}
                            </span>
                          </td>
                          <td className="p-4">{formatarMoeda(pedido.valor_total)}</td>
                          <td className="p-4 text-slate-500">
                            {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(pedido)
                              }}
                            >
                              <span className="text-base leading-none">👁️</span>
                            </Button>
                            {pedido.status === "aberto" && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  abrirEdicao(pedido)
                                }}
                              >
                                <span className="text-base leading-none">✏️</span>
                              </Button>
                            )}
                            {(pedido.status === "aberto" || pedido.status === "enviado") && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  enviarPorEmail(pedido)
                                }}
                                disabled={enviandoEmailId === pedido.id}
                                title="Enviar por e-mail"
                              >
                                <Mail size={16} className="text-blue-500" />
                              </Button>
                            )}
                            {(pedido.status === "aberto" || pedido.status === "enviado") && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  enviarPorWhatsapp(pedido)
                                }}
                                title="Enviar por WhatsApp"
                              >
                                <MessageCircle size={16} className="text-emerald-500" />
                              </Button>
                            )}
                            {pedido.status === "enviado" && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  lancarEntrada(pedido)
                                }}
                                title="Lançar entrada"
                              >
                                <ArrowRightCircle size={16} className="text-primary" />
                              </Button>
                            )}
                            {pedido.status !== "atendido" && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  excluir(pedido)
                                }}
                              >
                                <span className="text-base leading-none">🗑️</span>
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
        titulo={detalhe ? numeroFormatado(detalhe.numero) : ""}
        campos={
          detalhe
            ? [
                { label: "Fornecedor", valor: detalhe.fornecedor_nome },
                { label: "Status", valor: STATUS_LABEL[detalhe.status] },
                ...(Number(detalhe.desconto) > 0
                  ? [{ label: "Desconto", valor: formatarMoeda(detalhe.desconto) }]
                  : []),
                { label: "Total", valor: formatarMoeda(detalhe.valor_total) },
                { label: "Data", valor: new Date(detalhe.criado_em).toLocaleDateString("pt-BR") },
                ...(detalhe.observacao ? [{ label: "Observação", valor: detalhe.observacao }] : []),
                ...(detalhe.enviado_email_em
                  ? [{ label: "E-mail enviado em", valor: new Date(detalhe.enviado_email_em).toLocaleString("pt-BR") }]
                  : []),
              ]
            : []
        }
      />
    </div>
  )
}
