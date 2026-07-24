"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Plus } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"

export type Cliente = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  cpf_cnpj: string | null
  criado_em: string
  veio_do_site: boolean
}

export function ClientesConteudo({ clientesIniciais }: { clientesIniciais: Cliente[] }) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)
  const [busca, setBusca] = useState("")
  // clienteEditando === null e modalAberto === false: modal fechado.
  // clienteEditando === null e modalAberto === true: cadastrando um novo.
  // clienteEditando preenchido: editando o cliente existente.
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cpfCnpj, setCpfCnpj] = useState("")
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function recarregar() {
    const resposta = await fetch("/api/admin/clientes")
    setClientes(await resposta.json())
  }

  function abrirNovo() {
    setClienteEditando(null)
    setNome("")
    setEmail("")
    setTelefone("")
    setCpfCnpj("")
    setErro("")
    setModalAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEditando(cliente)
    setNome(cliente.nome)
    setEmail(cliente.email || "")
    setTelefone(cliente.telefone || "")
    setCpfCnpj(cliente.cpf_cnpj || "")
    setErro("")
    setModalAberto(true)
  }

  function fechar() {
    setModalAberto(false)
    setClienteEditando(null)
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    // Editar so mexe em dados cadastrais (nao mexe no e-mail/senha de login do
    // cliente do site); criar aceita e-mail opcional pra contato de balcao.
    const url = clienteEditando ? `/api/admin/clientes/${clienteEditando.id}` : "/api/admin/clientes"
    const method = clienteEditando ? "PUT" : "POST"
    const corpo = clienteEditando
      ? { nome, telefone, cpf_cnpj: cpfCnpj }
      : { nome, email, telefone, cpf_cnpj: cpfCnpj }

    const resposta = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    const salvo = await resposta.json()
    registrarAuditoria({
      tela: "Clientes",
      acao: clienteEditando ? "edicao" : "cadastro",
      tabela: "TAB_CLIENTE",
      registroId: clienteEditando?.id ?? salvo.id,
      antes: clienteEditando
        ? {
            nome: clienteEditando.nome,
            telefone: clienteEditando.telefone,
            cpf_cnpj: clienteEditando.cpf_cnpj,
          }
        : null,
      depois: { nome, telefone, cpf_cnpj: cpfCnpj },
    })

    fechar()
    recarregar()
  }

  const clientesFiltrados = clientes.filter((c) =>
    `${c.nome} ${c.email || ""} ${c.telefone || ""}`.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button onClick={abrirNovo}>
          <Plus size={16} className="mr-2" />
          Novo cliente
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome, email ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          {clientesFiltrados.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhum cliente encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Nome</th>
                    <th className="p-4 font-medium">Origem</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Telefone</th>
                    <th className="p-4 font-medium">CPF/CNPJ</th>
                    <th className="p-4 font-medium text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-slate-200 last:border-0">
                      <td className="p-4">{cliente.nome}</td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            cliente.veio_do_site
                              ? "bg-emerald-600/20 text-emerald-400"
                              : "bg-amber-600/20 text-amber-400"
                          }`}
                        >
                          {cliente.veio_do_site ? "Site" : "Balcao"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{cliente.email || "-"}</td>
                      <td className="p-4 text-slate-500">{cliente.telefone || "-"}</td>
                      <td className="p-4 text-slate-500">{cliente.cpf_cnpj || "-"}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(cliente)}>
                          <Pencil size={16} />
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

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-lg font-semibold">
                {clienteEditando ? `Editando: ${clienteEditando.nome}` : "Novo cliente"}
              </h2>

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
              </div>
              {!clienteEditando && (
                <div className="space-y-2">
                  <Label>E-mail (opcional)</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="So se o cliente for usar o site"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <Input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
              </div>

              {erro && <p className="text-sm text-red-500">{erro}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={fechar}>
                  Cancelar
                </Button>
                <Button onClick={salvar} disabled={salvando || !nome.trim()}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
