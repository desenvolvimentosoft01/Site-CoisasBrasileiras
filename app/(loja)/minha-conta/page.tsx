"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { mascaraCpfCnpj, mascaraTelefone, formatarMoeda } from "@/lib/mascaras"
import { MapPin, Package, LogOut } from "lucide-react"

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
}

const rotulosStatus: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separacao",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

export default function MinhaContaPage() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cpfCnpj, setCpfCnpj] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    async function carregar() {
      const respostaPerfil = await fetch("/api/cliente/perfil")
      if (!respostaPerfil.ok) {
        router.push("/entrar?voltar=/minha-conta")
        return
      }
      const dadosPerfil: Perfil = await respostaPerfil.json()
      setPerfil(dadosPerfil)
      setNome(dadosPerfil.nome)
      setTelefone(dadosPerfil.telefone ? mascaraTelefone(dadosPerfil.telefone) : "")
      setCpfCnpj(dadosPerfil.cpf_cnpj ? mascaraCpfCnpj(dadosPerfil.cpf_cnpj) : "")

      const respostaPedidos = await fetch("/api/cliente/pedidos")
      if (respostaPedidos.ok) setPedidos(await respostaPedidos.json())

      setCarregando(false)
    }
    carregar()
  }, [router])

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
