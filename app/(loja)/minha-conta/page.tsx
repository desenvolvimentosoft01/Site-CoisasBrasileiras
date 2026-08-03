"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { mascaraCpfCnpj, mascaraTelefone, formatarMoeda } from "@/lib/mascaras"
import { MapPin, Package, LogOut, Sparkles, Heart, X, ShoppingBag } from "lucide-react"

type Endereco = {
  id: string
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  principal: boolean
}

type Perfil = {
  nome: string
  email: string
  telefone: string | null
  cpf_cnpj: string | null
  enderecos: Endereco[]
}

type Pedido = {
  id: string
  status: string
  total: string
  codigo_rastreio: string | null
  transportadora: string | null
  criado_em: string
  bling_link_danfe: string | null
}

type ProdutoDesejado = {
  id: string
  nome: string
  slug: string
  preco: string
  preco_promocional: string | null
  estoque: number
  imagem_url: string | null
}

const rotulosStatus: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

type Assinatura = {
  status: "pendente" | "autorizada" | "pausada" | "cancelada"
  valor_mensalidade: string
  proximo_vencimento: string | null
} | null

const rotulosAssinatura: Record<string, string> = {
  pendente: "Aguardando confirmacao do pagamento",
  autorizada: "Ativa",
  pausada: "Pausada",
  cancelada: "Cancelada",
}

export default function MinhaContaPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-16 text-center text-neutral-500">Carregando...</div>}>
      <MinhaContaConteudo />
    </Suspense>
  )
}

function MinhaContaConteudo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clubeRef = useRef<HTMLDivElement>(null)
  const assinarAutomaticamente = searchParams.get("assinar") === "1"
  const jaTentouAutoAssinar = useRef(false)
  const [carregando, setCarregando] = useState(true)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [listaDesejos, setListaDesejos] = useState<ProdutoDesejado[]>([])
  const [assinatura, setAssinatura] = useState<Assinatura>(null)
  const [valorMensalidadeClube, setValorMensalidadeClube] = useState(0)
  const [processandoClube, setProcessandoClube] = useState(false)
  const [erroClube, setErroClube] = useState("")

  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cpfCnpj, setCpfCnpj] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    async function carregar() {
      const respostaPerfil = await fetch("/api/cliente/perfil")
      if (!respostaPerfil.ok) {
        // Preserva "?assinar=1" (link de "Saiba mais" do preco do Clube) pra
        // voltar direto pro fluxo de assinatura depois do login, em vez de
        // cair na conta e ter que procurar o botao de novo.
        const destino = assinarAutomaticamente ? "/minha-conta?assinar=1" : "/minha-conta"
        router.push(`/entrar?voltar=${encodeURIComponent(destino)}`)
        return
      }
      const dadosPerfil: Perfil = await respostaPerfil.json()
      setPerfil(dadosPerfil)
      setNome(dadosPerfil.nome)
      setTelefone(dadosPerfil.telefone ? mascaraTelefone(dadosPerfil.telefone) : "")
      setCpfCnpj(dadosPerfil.cpf_cnpj ? mascaraCpfCnpj(dadosPerfil.cpf_cnpj) : "")

      const respostaPedidos = await fetch("/api/cliente/pedidos")
      if (respostaPedidos.ok) setPedidos(await respostaPedidos.json())

      const respostaDesejos = await fetch("/api/cliente/lista-desejos")
      if (respostaDesejos.ok) setListaDesejos(await respostaDesejos.json())

      const respostaClube = await fetch("/api/cliente/clube")
      let assinaturaAtual: Assinatura = null
      let valorAtual = 0
      if (respostaClube.ok) {
        const dadosClube = await respostaClube.json()
        assinaturaAtual = dadosClube.assinatura
        valorAtual = dadosClube.valorMensalidade
        setAssinatura(assinaturaAtual)
        setValorMensalidadeClube(valorAtual)
      }

      setCarregando(false)

      // Veio do "Saiba mais" do preco do Clube (produto): se ainda nao e
      // assinante, dispara o fluxo de pagamento direto, sem precisar descer
      // a tela e clicar em "Assinar o Clube" de novo. Se ja e assinante, so
      // rola ate a secao pra mostrar o status.
      const semAssinaturaAtiva = !assinaturaAtual || assinaturaAtual.status === "cancelada"
      if (assinarAutomaticamente && !jaTentouAutoAssinar.current) {
        jaTentouAutoAssinar.current = true
        if (semAssinaturaAtiva && valorAtual > 0) {
          assinarClube()
        } else {
          clubeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function assinarClube() {
    setErroClube("")
    setProcessandoClube(true)
    const resposta = await fetch("/api/cliente/clube/assinar", { method: "POST" })
    const dados = await resposta.json()
    setProcessandoClube(false)

    if (!resposta.ok) {
      setErroClube(dados.erro || "Erro ao criar assinatura")
      return
    }
    window.location.href = dados.initPoint
  }

  async function cancelarClube() {
    if (
      !confirm(
        "Tem certeza que deseja cancelar sua assinatura do Clube?\n\nVoce deixara de ter acesso aos precos exclusivos de assinante imediatamente.",
      )
    )
      return

    setErroClube("")
    setProcessandoClube(true)
    const resposta = await fetch("/api/cliente/clube/cancelar", { method: "POST" })
    const dados = await resposta.json()
    setProcessandoClube(false)

    if (!resposta.ok) {
      setErroClube(dados.erro || "Erro ao cancelar assinatura")
      return
    }
    setAssinatura((atual) => (atual ? { ...atual, status: "cancelada" } : atual))
  }

  async function salvarPerfil(evento: React.FormEvent) {
    evento.preventDefault()
    setSalvando(true)
    setSalvo(false)

    const resposta = await fetch("/api/cliente/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        telefone: telefone.replace(/\D/g, "") || null,
        cpfCnpj: cpfCnpj.replace(/\D/g, "") || null,
      }),
    })

    setSalvando(false)
    if (resposta.ok) {
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    }
  }

  async function removerDaListaDesejos(produtoId: string) {
    setListaDesejos((atual) => atual.filter((p) => p.id !== produtoId))
    await fetch(`/api/cliente/lista-desejos/${produtoId}`, { method: "DELETE" })
  }

  async function sair() {
    await fetch("/api/cliente/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  if (carregando || !perfil) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-neutral-500">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 md:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold text-emerald-950">Minha conta</h1>
        <Button variant="outline" size="sm" onClick={sair}>
          <LogOut size={16} className="mr-2" />
          Sair
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvarPerfil} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={perfil.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(mascaraCpfCnpj(e.target.value))}
                inputMode="numeric"
              />
            </div>
            <div className="flex items-end gap-3 sm:col-span-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar alteracoes"}
              </Button>
              {salvo && <span className="text-sm text-emerald-600">Salvo!</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <div id="clube" ref={clubeRef}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles size={18} />
            Clube
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!assinatura || assinatura.status === "cancelada" ? (
            <>
              <p className="text-sm text-neutral-600">
                Assine o Clube por {formatarMoeda(String(valorMensalidadeClube))}/mes e tenha preco
                exclusivo em produtos selecionados.
              </p>
              <Button onClick={assinarClube} disabled={processandoClube || valorMensalidadeClube <= 0}>
                {processandoClube ? "Redirecionando..." : "Assinar o Clube"}
              </Button>
              {valorMensalidadeClube <= 0 && (
                <p className="text-xs text-neutral-400">Assinatura ainda nao disponivel.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm">
                Status:{" "}
                <span
                  className={
                    assinatura.status === "autorizada" ? "font-medium text-emerald-600" : "font-medium text-amber-600"
                  }
                >
                  {rotulosAssinatura[assinatura.status]}
                </span>
              </p>
              <p className="text-sm text-neutral-500">
                Mensalidade: {formatarMoeda(assinatura.valor_mensalidade)}
                {assinatura.proximo_vencimento &&
                  ` · Proxima cobranca: ${new Date(assinatura.proximo_vencimento).toLocaleDateString("pt-BR")}`}
              </p>
              {assinatura.status === "autorizada" && (
                <Button variant="outline" size="sm" onClick={cancelarClube} disabled={processandoClube}>
                  {processandoClube ? "Cancelando..." : "Cancelar assinatura"}
                </Button>
              )}
            </>
          )}
          {erroClube && <p className="text-sm text-red-500">{erroClube}</p>}
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart size={18} />
            Lista de desejos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {listaDesejos.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum produto favoritado ainda.</p>
          ) : (
            listaDesejos.map((produto) => (
              <div
                key={produto.id}
                className="flex items-center gap-3 rounded-md border border-black/5 p-3 text-sm"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-emerald-50">
                  {produto.imagem_url ? (
                    <Image src={produto.imagem_url} alt={produto.nome} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-emerald-300">
                      <ShoppingBag size={20} />
                    </div>
                  )}
                </div>
                <Link href={`/produtos/${produto.slug}`} className="flex-1 hover:underline">
                  <p className="font-medium">{produto.nome}</p>
                  <p className="text-neutral-500">
                    {formatarMoeda(produto.preco_promocional ?? produto.preco)}
                    {produto.estoque <= 0 && <span className="ml-2 text-red-500">Esgotado</span>}
                  </p>
                </Link>
                <button
                  onClick={() => removerDaListaDesejos(produto.id)}
                  className="rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Remover da lista de desejos"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin size={18} />
            Enderecos salvos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {perfil.enderecos.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Nenhum endereco salvo ainda - ele e criado automaticamente no primeiro checkout.
            </p>
          ) : (
            perfil.enderecos.map((endereco) => (
              <div key={endereco.id} className="rounded-md border border-black/5 p-3 text-sm">
                <p>
                  {endereco.logradouro}, {endereco.numero}
                  {endereco.complemento ? ` - ${endereco.complemento}` : ""}
                </p>
                <p className="text-neutral-500">
                  {endereco.bairro}, {endereco.cidade}/{endereco.estado} - {endereco.cep}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package size={18} />
            Meus pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pedidos.length === 0 ? (
            <p className="text-sm text-neutral-500">Voce ainda nao fez nenhum pedido.</p>
          ) : (
            pedidos.map((pedido) => (
              <Link
                key={pedido.id}
                href={`/pedido/${pedido.id}`}
                className="flex items-center justify-between rounded-md border border-black/5 p-3 text-sm hover:bg-emerald-50/50"
              >
                <div>
                  <div className="font-medium">
                    {rotulosStatus[pedido.status] ?? pedido.status}
                    {pedido.codigo_rastreio && (
                      <span className="ml-2 text-xs text-neutral-500">
                        Rastreio: {pedido.codigo_rastreio}
                      </span>
                    )}
                  </div>
                  <div className="text-neutral-500">
                    {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <span className="font-medium text-emerald-700">{formatarMoeda(pedido.total)}</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
