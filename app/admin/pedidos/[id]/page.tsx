"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Truck, MessageCircle, FileText, BadgeCheck, ArrowLeft, ShoppingBag, RefreshCw } from "lucide-react"
import { CANAL_LABEL, type CanalPedido } from "@/lib/canal-pedido"
import { SITUACAO_NFE_BLING_LABEL } from "@/lib/bling-situacao-nfe"

type Pedido = {
  id: string
  status: string
  total: string
  forma_pagamento: string | null
  nota_fiscal_url: string | null
  codigo_rastreio: string | null
  transportadora: string | null
  bling_nota_id: string | null
  bling_link_danfe: string | null
  bling_link_pdf: string | null
  bling_nota_cancelada_em: string | null
  bling_pedido_id: string | null
  bling_nota_email_enviada_em: string | null
  nota_fiscal_whatsapp_enviada_em: string | null
  bling_nota_situacao: number | null
  bling_nota_situacao_atualizada_em: string | null
  origem: "site" | "balcao"
  canal: CanalPedido | null
  criado_em: string
  cliente_nome: string
  cliente_email: string | null
  cliente_telefone: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  itens: { quantidade: number; preco_unitario: string; produto_nome: string }[]
}

// Todos os status possiveis - usado so pra rotulo/exibicao (rotulosStatus).
const opcoesStatus = [
  { valor: "aguardando_pagamento", rotulo: "Aguardando pagamento" },
  { valor: "pago", rotulo: "Pago" },
  { valor: "em_separacao", rotulo: "Em separação" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "entregue", rotulo: "Entregue" },
  { valor: "cancelado", rotulo: "Cancelado" },
]

// So esses podem ser escolhidos manualmente no dropdown. "Pago" fica de fora
// de proposito - so o webhook do Mercado Pago confirma pagamento de verdade
// (ou o pedido ja nasce pago, na Venda Balcao); deixar o admin marcar "Pago"
// na mao abriria brecha pra liberar um pedido sem o dinheiro ter entrado.
// "Aguardando pagamento" tambem fica de fora - nao faz sentido voltar pra
// esse estado manualmente.
const opcoesStatusSelecionaveis = opcoesStatus.filter(
  (opcao) => opcao.valor !== "pago" && opcao.valor !== "aguardando_pagamento"
)

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const rotulosStatus: Record<string, string> = Object.fromEntries(
  opcoesStatus.map((o) => [o.valor, o.rotulo])
)

function montarMensagemWhatsapp(pedido: Pedido): string {
  const numeroPedido = pedido.id.slice(0, 8).toUpperCase()
  let mensagem = `Olá ${pedido.cliente_nome}! Seu pedido #${numeroPedido} na Coisas Brasileiras está com status: ${rotulosStatus[pedido.status] ?? pedido.status}.`

  if (pedido.codigo_rastreio) {
    mensagem += ` Código de rastreio: ${pedido.codigo_rastreio}${pedido.transportadora ? ` (${pedido.transportadora})` : ""}.`
  }

  return mensagem
}

export default function DetalhePedidoPage() {
  const params = useParams<{ id: string }>()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const [codigoRastreio, setCodigoRastreio] = useState("")
  const [transportadora, setTransportadora] = useState("")
  const [salvandoRastreio, setSalvandoRastreio] = useState(false)
  const [rastreioSalvo, setRastreioSalvo] = useState(false)
  const [codigoServicoFrenet, setCodigoServicoFrenet] = useState("")
  const [validandoRastreio, setValidandoRastreio] = useState(false)
  const [resultadoValidacao, setResultadoValidacao] = useState<{
    status: string
    eventos: { data: string | null; status: string; local: string | null }[]
  } | null>(null)
  const [erroValidacao, setErroValidacao] = useState("")
  const [emitindoNfe, setEmitindoNfe] = useState(false)
  const [erroNfe, setErroNfe] = useState("")
  const [justificativaCancelamento, setJustificativaCancelamento] = useState("")
  const [cancelandoNfe, setCancelandoNfe] = useState(false)
  const [erroCancelamento, setErroCancelamento] = useState("")
  const [mostrarFormCancelar, setMostrarFormCancelar] = useState(false)
  const [atualizandoSituacaoNfe, setAtualizandoSituacaoNfe] = useState(false)
  const [erroSituacaoNfe, setErroSituacaoNfe] = useState("")

  const carregar = useCallback(async () => {
    const resposta = await fetch(`/api/admin/pedidos/${params.id}`)
    if (resposta.ok) {
      const dados: Pedido = await resposta.json()
      setPedido(dados)
      setCodigoRastreio(dados.codigo_rastreio ?? "")
      setTransportadora(dados.transportadora ?? "")
    }
  }, [params.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega os dados do pedido ao montar/trocar de id
    carregar()
  }, [carregar])

  async function alterarStatus(novoStatus: string) {
    if (!pedido) return
    setSalvandoStatus(true)
    await fetch(`/api/admin/pedidos/${pedido.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    })
    setSalvandoStatus(false)
    carregar()
  }

  async function atualizarSituacaoNfe() {
    if (!pedido) return
    setErroSituacaoNfe("")
    setAtualizandoSituacaoNfe(true)
    const resposta = await fetch(`/api/admin/pedidos/${pedido.id}/atualizar-situacao-nfe`, { method: "POST" })
    setAtualizandoSituacaoNfe(false)
    if (!resposta.ok) {
      const dados = await resposta.json()
      setErroSituacaoNfe(dados.erro || "Erro ao consultar situação no Bling")
      return
    }
    carregar()
  }

  async function validarRastreio(): Promise<boolean> {
    setErroValidacao("")
    setResultadoValidacao(null)
    setValidandoRastreio(true)

    const resposta = await fetch(`/api/admin/pedidos/${params.id}/validar-rastreio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigoRastreio, codigoServicoFrenet }),
    })

    setValidandoRastreio(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErroValidacao(dados.erro || "Código de rastreio inválido na Frenet")
      return false
    }
    setResultadoValidacao(await resposta.json())
    return true
  }

  async function salvarRastreio() {
    if (!pedido) return
    setErroValidacao("")

    // Se o codigo de servico da Frenet estiver preenchido, valida o rastreio
    // ANTES de salvar/notificar - sem isso, um codigo digitado errado seria
    // salvo e o cliente notificado com uma informacao falsa.
    if (codigoRastreio.trim() && codigoServicoFrenet.trim()) {
      const valido = await validarRastreio()
      if (!valido) return
    }

    setSalvandoRastreio(true)
    await fetch(`/api/admin/pedidos/${pedido.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigoRastreio, transportadora }),
    })
    setSalvandoRastreio(false)
    setRastreioSalvo(true)
    setTimeout(() => setRastreioSalvo(false), 2000)
    carregar()
  }

  async function emitirNfe() {
    if (!pedido) return
    setErroNfe("")
    setEmitindoNfe(true)
    const resposta = await fetch(`/api/admin/pedidos/${pedido.id}/emitir-nfe`, { method: "POST" })
    setEmitindoNfe(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErroNfe(dados.erro || "Erro ao emitir NF-e")
      return
    }
    carregar()
  }

  async function marcarWhatsappEnviado() {
    if (!pedido) return
    await fetch(`/api/admin/pedidos/${pedido.id}/marcar-whatsapp-nfe`, { method: "POST" })
    carregar()
  }

  async function cancelarNfe() {
    if (!pedido) return
    setErroCancelamento("")
    setCancelandoNfe(true)
    const resposta = await fetch(`/api/admin/pedidos/${pedido.id}/cancelar-nfe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ justificativa: justificativaCancelamento }),
    })
    setCancelandoNfe(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErroCancelamento(dados.erro || "Erro ao cancelar NF-e")
      return
    }
    setMostrarFormCancelar(false)
    setJustificativaCancelamento("")
    carregar()
  }

  if (!pedido) {
    return <p className="text-sm text-slate-500">Carregando...</p>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex gap-1 border-b border-slate-200">
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} />
          Lista de pedidos
        </Link>
        <span className="border-b-2 border-primary px-3 py-2 text-sm font-medium text-primary">
          Detalhe do pedido
        </span>
      </div>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          Pedido
          {pedido.origem === "balcao" && (
            <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-400">
              Venda balcão
            </span>
          )}
        </h1>
        <p className="text-sm text-slate-500">
          Feito em {new Date(pedido.criado_em).toLocaleString("pt-BR")}
        </p>
      </div>

      {(pedido.canal === "mercadolivre" || pedido.canal === "shopee") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
              <ShoppingBag size={16} />
              Origem: {CANAL_LABEL[pedido.canal]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Importado automaticamente do Bling.
              {pedido.bling_pedido_id && (
                <> Pedido {CANAL_LABEL[pedido.canal]} #{pedido.bling_pedido_id} (via Bling).</>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Status</CardTitle>
        </CardHeader>
        <CardContent>
          {pedido.status === "aguardando_pagamento" ? (
            <div className="space-y-2">
              <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1.5 text-sm text-amber-600">
                Aguardando pagamento (automático via Mercado Pago)
              </span>
              <p className="text-xs text-muted-foreground">
                Só vira &quot;Pago&quot; quando o Mercado Pago confirmar - não dá pra marcar manualmente
                (evita liberar pedido sem o pagamento ter entrado de verdade). Só resta cancelar.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => alterarStatus("cancelado")}
                disabled={salvandoStatus}
              >
                {salvandoStatus ? "Cancelando..." : "Cancelar pedido"}
              </Button>
            </div>
          ) : (
            <select
              value={pedido.status}
              onChange={(e) => alterarStatus(e.target.value)}
              disabled={salvandoStatus}
              className="w-full max-w-xs rounded-md border border-slate-300 bg-slate-100 p-2 text-sm"
            >
              {pedido.status === "pago" && (
                <option value="pago" disabled>
                  Pago
                </option>
              )}
              {opcoesStatusSelecionaveis.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          )}
          {pedido.forma_pagamento && (
            <p className="mt-2 text-sm text-slate-500">
              Forma de pagamento: <span className="font-medium">{pedido.forma_pagamento}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
            <FileText size={16} />
            Nota fiscal (Bling)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pedido.bling_nota_id && !pedido.bling_nota_cancelada_em ? (
            <div className="space-y-3 text-sm">
              <p className="text-slate-500">NF-e emitida (Bling #{pedido.bling_nota_id}).</p>
              <div className="flex flex-wrap items-center gap-2">
                {pedido.bling_nota_situacao != null && (
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                    {SITUACAO_NFE_BLING_LABEL[pedido.bling_nota_situacao] ?? pedido.bling_nota_situacao}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={atualizarSituacaoNfe}
                  disabled={atualizandoSituacaoNfe}
                >
                  <RefreshCw size={14} className={`mr-1.5 ${atualizandoSituacaoNfe ? "animate-spin" : ""}`} />
                  {atualizandoSituacaoNfe ? "Consultando..." : "Atualizar situação no Bling"}
                </Button>
                {pedido.bling_nota_situacao_atualizada_em && (
                  <span className="text-xs text-slate-400">
                    Consultado em {new Date(pedido.bling_nota_situacao_atualizada_em).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
              {erroSituacaoNfe && <p className="text-xs text-red-500">{erroSituacaoNfe}</p>}
              {pedido.cliente_email && (
                <p className="text-xs text-slate-500">
                  {pedido.bling_nota_email_enviada_em ? (
                    <span className="text-emerald-600">
                      Enviada por e-mail em {new Date(pedido.bling_nota_email_enviada_em).toLocaleString("pt-BR")}
                    </span>
                  ) : (
                    <span className="text-amber-600">Ainda não enviada por e-mail (falha no envio)</span>
                  )}
                </p>
              )}
              <div className="flex gap-3">
                {pedido.bling_link_danfe && (
                  <a
                    href={pedido.bling_link_danfe}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Ver DANFE
                  </a>
                )}
                {pedido.bling_link_pdf && (
                  <a
                    href={pedido.bling_link_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Ver PDF
                  </a>
                )}
              </div>

              {!mostrarFormCancelar ? (
                <Button size="sm" variant="outline" onClick={() => setMostrarFormCancelar(true)}>
                  Cancelar NF-e
                </Button>
              ) : (
                <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <p className="text-xs text-amber-600">
                    O estoque dos itens deste pedido será estornado automaticamente ao cancelar a nota.
                  </p>
                  <Label className="text-xs">
                    Justificativa do cancelamento (mínimo 15 caracteres, exigência da Sefaz)
                  </Label>
                  <Input
                    value={justificativaCancelamento}
                    onChange={(e) => setJustificativaCancelamento(e.target.value)}
                    placeholder="Ex: Erro no valor da nota, pedido cancelado pelo cliente..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={cancelarNfe}
                      disabled={cancelandoNfe || justificativaCancelamento.trim().length < 15}
                    >
                      {cancelandoNfe ? "Cancelando..." : "Confirmar cancelamento"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setMostrarFormCancelar(false)}>
                      Voltar
                    </Button>
                  </div>
                  {erroCancelamento && <p className="text-sm text-red-500">{erroCancelamento}</p>}
                </div>
              )}
            </div>
          ) : (
            <>
              {pedido.bling_nota_cancelada_em && (
                <p className="text-sm text-amber-500">
                  NF-e anterior (Bling #{pedido.bling_nota_id}) cancelada em{" "}
                  {new Date(pedido.bling_nota_cancelada_em).toLocaleString("pt-BR")}. Pode emitir uma nova
                  abaixo.
                </p>
              )}
              <Button size="sm" onClick={emitirNfe} disabled={emitindoNfe}>
                {emitindoNfe ? "Emitindo..." : "Emitir NF-e"}
              </Button>
              {erroNfe && <p className="text-sm text-red-500">{erroNfe}</p>}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
            <Truck size={16} />
            Rastreio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Transportadora</Label>
              <Input
                value={transportadora}
                onChange={(e) => setTransportadora(e.target.value)}
                placeholder="Ex: Correios, Jadlog..."
              />
            </div>
            <div className="space-y-2">
              <Label>Código de rastreio</Label>
              <Input
                value={codigoRastreio}
                onChange={(e) => setCodigoRastreio(e.target.value.toUpperCase())}
                placeholder="Ex: BR123456789BR"
              />
              {transportadora.trim().toLowerCase().includes("correios") &&
                codigoRastreio.trim() !== "" &&
                !/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(codigoRastreio.trim()) && (
                  <p className="text-xs text-amber-500">
                    Formato incomum pros Correios (esperado: 2 letras + 9 números + 2 letras, ex:
                    BR123456789BR). Salva do mesmo jeito, só um alerta.
                  </p>
                )}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
            <Label className="flex items-center gap-1.5 text-xs">
              <BadgeCheck size={14} />
              Validar rastreio na Frenet (opcional)
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={codigoServicoFrenet}
                onChange={(e) => setCodigoServicoFrenet(e.target.value)}
                placeholder="Código do serviço Frenet (painel da conta)"
                className="max-w-56"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => validarRastreio()}
                disabled={validandoRastreio || !codigoRastreio || !codigoServicoFrenet}
              >
                {validandoRastreio ? "Validando..." : "Validar agora"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Se preencher o código de serviço, o rastreio é validado automaticamente ao clicar em
              &quot;Salvar e notificar cliente&quot; - se o código não existir de verdade na transportadora,
              o salvamento e a notificação são bloqueados. Sem o código de serviço preenchido, não
              dá pra validar (fica só o aviso de formato) e o salvamento funciona normal.
            </p>
            {erroValidacao && <p className="text-sm text-red-500">{erroValidacao}</p>}
            {resultadoValidacao && (
              <div className="rounded-md bg-emerald-500/10 p-2 text-sm text-emerald-600">
                <p className="font-medium">Status: {resultadoValidacao.status}</p>
                {resultadoValidacao.eventos.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-emerald-700">
                    {resultadoValidacao.eventos.map((evento, indice) => (
                      <li key={indice}>
                        {evento.data && `${evento.data} - `}
                        {evento.status}
                        {evento.local && ` (${evento.local})`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={salvarRastreio} disabled={salvandoRastreio}>
              {salvandoRastreio ? "Salvando..." : "Salvar e notificar cliente"}
            </Button>
            {rastreioSalvo && <span className="text-sm text-emerald-500">Salvo e cliente notificado!</span>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <p>{pedido.cliente_nome}</p>
              {pedido.cliente_email && <p className="text-slate-500">{pedido.cliente_email}</p>}
              {pedido.cliente_telefone && <p className="text-slate-500">{pedido.cliente_telefone}</p>}
            </div>
            {pedido.cliente_telefone && (
              <div className="space-y-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={`https://wa.me/55${pedido.cliente_telefone.replace(/\D/g, "")}?text=${encodeURIComponent(montarMensagemWhatsapp(pedido))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={marcarWhatsappEnviado}
                    />
                  }
                >
                  <MessageCircle size={14} className="mr-2 text-[#25D366]" />
                  Enviar status por WhatsApp
                </Button>
                {pedido.nota_fiscal_whatsapp_enviada_em && (
                  <p className="text-xs text-emerald-600">
                    Marcado como enviado em{" "}
                    {new Date(pedido.nota_fiscal_whatsapp_enviada_em).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Endereço de entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-400">
            {pedido.logradouro ? (
              <>
                <p>
                  {pedido.logradouro}, {pedido.numero}
                  {pedido.complemento ? ` - ${pedido.complemento}` : ""}
                </p>
                <p>{pedido.bairro}</p>
                <p>
                  {pedido.cidade}/{pedido.estado} - {pedido.cep}
                </p>
              </>
            ) : (
              <p className="text-slate-400">Venda balcão - sem entrega.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Itens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pedido.itens.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.quantidade}x {item.produto_nome}
              </span>
              <span className="font-medium">
                {formatarPreco(String(Number(item.preco_unitario) * item.quantidade))}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatarPreco(pedido.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
