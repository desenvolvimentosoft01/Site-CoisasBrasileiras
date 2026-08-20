"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Pencil, Trash2, FilePlus, Mail, MessageCircle, Ban, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { formatarMoeda } from "@/lib/mascaras"
import { CotacaoForm, type Fornecedor, type ProdutoDisponivel, type CotacaoExistente } from "@/components/admin/cotacao-form"
import { toast } from "sonner"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"

export type Cotacao = {
  id: string
  numero: number
  status: "aberto" | "enviado" | "respondida" | "aceita" | "recusada" | "cancelada"
  observacao: string | null
  token_resposta: string
  enviado_email_em: string | null
  respondido_em: string | null
  pedido_compra_id: string | null
  criado_em: string
  fornecedor_id: string
  fornecedor_nome: string
  fornecedor_email: string | null
  fornecedor_telefone: string | null
}

const ABAS_STATUS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aberto", rotulo: "Em aberto" },
  { valor: "enviado", rotulo: "Enviadas" },
  { valor: "respondida", rotulo: "Respondidas" },
  { valor: "aceita", rotulo: "Aceitas" },
]

const CORES_STATUS: Record<Cotacao["status"], string> = {
  aberto: "bg-blue-600/20 text-blue-400",
  enviado: "bg-amber-500/20 text-amber-500",
  respondida: "bg-purple-500/20 text-purple-500",
  aceita: "bg-emerald-600/20 text-emerald-400",
  recusada: "bg-red-600/20 text-red-400",
  cancelada: "bg-slate-200 text-slate-400",
}

const STATUS_LABEL: Record<Cotacao["status"], string> = {
  aberto: "Aberto",
  enviado: "Enviado",
  respondida: "Respondida",
  aceita: "Aceita",
  recusada: "Recusada",
  cancelada: "Cancelada",
}

function numeroFormatado(n: number) {
  return `CT.${String(n).padStart(4, "0")}`
}

export function CotacoesConteudo({
  cotacoesIniciais,
  fornecedores,
  produtos,
}: {
  cotacoesIniciais: Cotacao[]
  fornecedores: Fornecedor[]
  produtos: ProdutoDisponivel[]
}) {
  const confirmar = useConfirmar()
  const [cotacoes, setCotacoes] = useState<Cotacao[]>(cotacoesIniciais)
  const [aba, setAba] = useState("todos")
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [editando, setEditando] = useState<CotacaoExistente | undefined>(undefined)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [detalhe, setDetalhe] = useState<CotacaoExistente | null>(null)
  const [enviandoEmailId, setEnviandoEmailId] = useState<string | null>(null)
  const [aceitandoId, setAceitandoId] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  async function recarregar() {
    const resposta = await fetch("/api/admin/cotacoes")
    setCotacoes(await resposta.json())
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

  async function buscarDetalhe(id: string): Promise<CotacaoExistente> {
    const resposta = await fetch(`/api/admin/cotacoes/${id}`)
    return resposta.json()
  }

  async function abrirEdicao(cotacao: Cotacao) {
    setLinhaSelecionada(cotacao.id)
    setMostrandoFormulario(true)
    setCarregandoDetalhe(true)
    setEditando(await buscarDetalhe(cotacao.id))
    setCarregandoDetalhe(false)
  }

  async function verDetalhe(cotacao: Cotacao) {
    setDetalhe(await buscarDetalhe(cotacao.id))
  }

  function handleSalvo() {
    setMostrandoFormulario(false)
    setEditando(undefined)
    recarregar()
  }

  async function enviarPorEmail(cotacao: Cotacao) {
    if (!cotacao.fornecedor_email) {
      toast.error("Esse fornecedor não tem e-mail cadastrado")
      return
    }
    setEnviandoEmailId(cotacao.id)
    const resposta = await fetch(`/api/admin/cotacoes/${cotacao.id}/enviar-email`, { method: "POST" })
    setEnviandoEmailId(null)
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao enviar o e-mail")
      return
    }
    toast.success(`Cotação enviada para ${cotacao.fornecedor_email}!`)
    recarregar()
  }

  async function enviarPorWhatsapp(cotacao: Cotacao) {
    const numero = cotacao.fornecedor_telefone?.replace(/\D/g, "")
    if (!numero) {
      toast.error("Esse fornecedor não tem telefone cadastrado")
      return
    }
    const numeroComDdi = numero.startsWith("55") ? numero : `55${numero}`
    const link = `${window.location.origin}/cotacao/responder/${cotacao.token_resposta}`
    const mensagem = `Olá, ${cotacao.fornecedor_nome}! Precisamos de uma cotação pro pedido ${numeroFormatado(cotacao.numero)}.\n\nAcesse o link pra informar a quantidade que consegue entregar e o preço de cada item: ${link}`
    window.open(`https://wa.me/${numeroComDdi}?text=${encodeURIComponent(mensagem)}`, "_blank")

    if (cotacao.status === "aberto") {
      await fetch(`/api/admin/cotacoes/${cotacao.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "enviado" }),
      }).catch(() => {})
      recarregar()
    }
  }

  async function aceitar(cotacao: Cotacao) {
    if (
      !(await confirmar({
        descricao: `Aceitar a cotação ${numeroFormatado(cotacao.numero)} e gerar um Pedido de Compra com os valores informados pelo fornecedor?`,
      }))
    )
      return
    setAceitandoId(cotacao.id)
    const resposta = await fetch(`/api/admin/cotacoes/${cotacao.id}/aceitar`, { method: "POST" })
    setAceitandoId(null)
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao aceitar a cotação")
      return
    }
    toast.success("Cotação aceita! Pedido de compra gerado.")
    recarregar()
  }

  async function recusar(cotacao: Cotacao) {
    if (!(await confirmar({ descricao: `Recusar a cotação ${numeroFormatado(cotacao.numero)}?`, destrutivo: true, consequencia: "A cotação fica marcada como recusada e sai da lista de pendentes. O fornecedor não é avisado automaticamente." }))) return
    const resposta = await fetch(`/api/admin/cotacoes/${cotacao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "recusada" }),
    })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao recusar")
      return
    }
    recarregar()
  }

  async function cancelar(cotacao: Cotacao) {
    if (!(await confirmar({ descricao: `Cancelar a cotação ${numeroFormatado(cotacao.numero)}?`, destrutivo: true, consequencia: "A cotação fica marcada como cancelada e o link de resposta para de funcionar." }))) return
    const resposta = await fetch(`/api/admin/cotacoes/${cotacao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelada" }),
    })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao cancelar")
      return
    }
    recarregar()
  }

  async function excluir(cotacao: Cotacao) {
    if (!(await confirmar({ descricao: `Excluir a cotação ${numeroFormatado(cotacao.numero)}?`, destrutivo: true, consequencia: "A cotação e as respostas dos fornecedores são apagadas, e o link enviado a eles para de funcionar." }))) return
    const resposta = await fetch(`/api/admin/cotacoes/${cotacao.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir")
      return
    }
    setLinhaSelecionada(null)
    recarregar()
  }

  const cotacoesFiltradas = aba === "todos" ? cotacoes : cotacoes.filter((c) => c.status === aba)
  const cotacaoSelecionada = cotacoes.find((c) => c.id === linhaSelecionada) ?? null

  if (mostrandoFormulario) {
    return carregandoDetalhe ? (
      <p className="text-sm text-slate-500">Carregando...</p>
    ) : (
      <CotacaoForm
        key={editando?.id ?? "novo"}
        cotacao={editando}
        fornecedores={fornecedores}
        produtosDisponiveis={produtos}
        onSalvo={handleSalvo}
        onCancelar={() => setMostrandoFormulario(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cotação</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          {ABAS_STATUS.map((item) => {
            const quantidade =
              item.valor === "todos" ? cotacoes.length : cotacoes.filter((c) => c.status === item.valor).length
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
                  onClick: () => cotacaoSelecionada && abrirEdicao(cotacaoSelecionada),
                  disabled: !cotacaoSelecionada || cotacaoSelecionada.status !== "aberto",
                },
                {
                  label: "Enviar e-mail",
                  icon: Mail,
                  onClick: () => cotacaoSelecionada && enviarPorEmail(cotacaoSelecionada),
                  disabled:
                    !cotacaoSelecionada ||
                    !["aberto", "enviado"].includes(cotacaoSelecionada.status) ||
                    enviandoEmailId === cotacaoSelecionada?.id,
                },
                {
                  label: "Enviar WhatsApp",
                  icon: MessageCircle,
                  onClick: () => cotacaoSelecionada && enviarPorWhatsapp(cotacaoSelecionada),
                  disabled: !cotacaoSelecionada || !["aberto", "enviado"].includes(cotacaoSelecionada.status),
                },
                {
                  label: "Aceitar",
                  icon: CheckCircle2,
                  onClick: () => cotacaoSelecionada && aceitar(cotacaoSelecionada),
                  disabled:
                    !cotacaoSelecionada || cotacaoSelecionada.status !== "respondida" || aceitandoId === cotacaoSelecionada?.id,
                },
                {
                  label: "Recusar",
                  icon: XCircle,
                  onClick: () => cotacaoSelecionada && recusar(cotacaoSelecionada),
                  disabled: !cotacaoSelecionada || cotacaoSelecionada.status !== "respondida",
                  variante: "danger",
                },
                {
                  label: "Cancelar",
                  icon: Ban,
                  onClick: () => cotacaoSelecionada && cancelar(cotacaoSelecionada),
                  disabled: !cotacaoSelecionada || !["aberto", "enviado"].includes(cotacaoSelecionada.status),
                  variante: "danger",
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => cotacaoSelecionada && excluir(cotacaoSelecionada),
                  disabled: !cotacaoSelecionada || cotacaoSelecionada.status === "aceita",
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {cotacoesFiltradas.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma cotação encontrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Número</th>
                        <th className="p-4 font-medium">Fornecedor</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cotacoesFiltradas.map((cotacao) => (
                        <tr
                          key={cotacao.id}
                          onClick={() => setLinhaSelecionada((atual) => (atual === cotacao.id ? null : cotacao.id))}
                          onDoubleClick={() => cotacao.status === "aberto" && abrirEdicao(cotacao)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === cotacao.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4 font-mono">{numeroFormatado(cotacao.numero)}</td>
                          <td className="p-4">{cotacao.fornecedor_nome}</td>
                          <td className="p-4">
                            <span className={`rounded-full px-2 py-1 text-xs ${CORES_STATUS[cotacao.status]}`}>
                              {STATUS_LABEL[cotacao.status]}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
                            {new Date(cotacao.criado_em).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                verDetalhe(cotacao)
                              }}
                            >
                              <span className="text-base leading-none">👁️</span>
                            </Button>
                            {cotacao.status === "respondida" && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  aceitar(cotacao)
                                }}
                                disabled={aceitandoId === cotacao.id}
                                title="Aceitar e gerar pedido de compra"
                              >
                                <CheckCircle2 size={16} className="text-emerald-500" />
                              </Button>
                            )}
                            {cotacao.status !== "aceita" && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  excluir(cotacao)
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
                { label: "Fornecedor", valor: fornecedores.find((f) => f.id === detalhe.fornecedor_id)?.razao_social ?? "" },
                { label: "Status", valor: STATUS_LABEL[detalhe.status] },
                ...(detalhe.observacao ? [{ label: "Observação", valor: detalhe.observacao }] : []),
                ...(detalhe.itens.some((i) => i.valor_unitario_cotado != null)
                  ? [
                      {
                        label: "Itens cotados",
                        valor: (
                          <ul className="space-y-1">
                            {detalhe.itens.map((item, indice) => (
                              <li key={indice}>
                                {item.descricao} - pedido: {item.quantidade_solicitada}
                                {item.quantidade_cotada != null && (
                                  <>
                                    {" "}
                                    / cotado: {item.quantidade_cotada} x{" "}
                                    {formatarMoeda(item.valor_unitario_cotado || "0")}
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        ),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />
    </div>
  )
}
