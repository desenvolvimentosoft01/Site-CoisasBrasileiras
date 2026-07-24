"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Truck, MessageCircle, FileText } from "lucide-react"

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
  origem: "site" | "balcao"
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

const opcoesStatus = [
  { valor: "aguardando_pagamento", rotulo: "Aguardando pagamento" },
  { valor: "pago", rotulo: "Pago" },
  { valor: "em_separacao", rotulo: "Em separacao" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "entregue", rotulo: "Entregue" },
  { valor: "cancelado", rotulo: "Cancelado" },
]

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const rotulosStatus: Record<string, string> = Object.fromEntries(
  opcoesStatus.map((o) => [o.valor, o.rotulo])
)

function montarMensagemWhatsapp(pedido: Pedido): string {
  const numeroPedido = pedido.id.slice(0, 8).toUpperCase()
  let mensagem = `Ola ${pedido.cliente_nome}! Seu pedido #${numeroPedido} na Coisas Brasileiras esta com status: ${rotulosStatus[pedido.status] ?? pedido.status}.`

  if (pedido.codigo_rastreio) {
    mensagem += ` Codigo de rastreio: ${pedido.codigo_rastreio}${pedido.transportadora ? ` (${pedido.transportadora})` : ""}.`
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
  const [emitindoNfe, setEmitindoNfe] = useState(false)
  const [erroNfe, setErroNfe] = useState("")

  async function carregar() {
    const resposta = await fetch(`/api/admin/pedidos/${params.id}`)
    if (resposta.ok) {
      const dados: Pedido = await resposta.json()
      setPedido(dados)
      setCodigoRastreio(dados.codigo_rastreio ?? "")
      setTransportadora(dados.transportadora ?? "")
    }
  }

  useEffect(() => {
    carregar()
  }, [params.id])

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

  async function salvarRastreio() {
    if (!pedido) return
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

  if (!pedido) {
    return <p className="text-sm text-slate-500">Carregando...</p>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          Pedido
          {pedido.origem === "balcao" && (
            <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-400">
              Venda balcao
            </span>
          )}
        </h1>
        <p className="text-sm text-slate-500">
          Feito em {new Date(pedido.criado_em).toLocaleString("pt-BR")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={pedido.status}
            onChange={(e) => alterarStatus(e.target.value)}
            disabled={salvandoStatus}
            className="w-full max-w-xs rounded-md border border-slate-300 bg-slate-100 p-2 text-sm"
          >
            {opcoesStatus.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
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
          {pedido.bling_nota_id ? (
            <div className="space-y-2 text-sm">
              <p className="text-slate-500">NF-e emitida (Bling #{pedido.bling_nota_id}).</p>
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
            </div>
          ) : (
            <>
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
              <Label>Codigo de rastreio</Label>
              <Input
                value={codigoRastreio}
                onChange={(e) => setCodigoRastreio(e.target.value)}
                placeholder="Ex: BR123456789BR"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={salvarRastreio} disabled={salvandoRastreio}>
              {salvandoRastreio ? "Salvando..." : "Salvar rastreio"}
            </Button>
            {rastreioSalvo && <span className="text-sm text-emerald-500">Salvo!</span>}
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
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={
                  <a
                    href={`https://wa.me/55${pedido.cliente_telefone.replace(/\D/g, "")}?text=${encodeURIComponent(montarMensagemWhatsapp(pedido))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <MessageCircle size={14} className="mr-2 text-[#25D366]" />
                Enviar status por WhatsApp
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Endereco de entrega</CardTitle>
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
              <p className="text-slate-400">Venda balcao - sem entrega.</p>
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
