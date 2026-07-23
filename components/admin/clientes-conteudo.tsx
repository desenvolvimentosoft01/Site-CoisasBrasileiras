"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"

export type Cliente = {
  id: string
  nome: string
  email: string
  telefone: string | null
  cpf_cnpj: string | null
  criado_em: string
}

export function ClientesConteudo({ clientesIniciais }: { clientesIniciais: Cliente[] }) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)
  const [busca, setBusca] = useState("")
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cpfCnpj, setCpfCnpj] = useState("")
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function recarregar() {
    const resposta = await fetch("/api/admin/clientes")
    setClientes(await resposta.json())
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEditando(cliente)
    setNome(cliente.nome)
    setTelefone(cliente.telefone || "")
    setCpfCnpj(cliente.cpf_cnpj || "")
    setErro("")
  }

  async function salvar() {
    if (!clienteEditando) return
    setErro("")
    setSalvando(true)

    const resposta = await fetch(`/api/admin/clientes/${clienteEditando.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, telefone, cpf_cnpj: cpfCnpj }),
    })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    registrarAuditoria({
      tela: "Clientes",
      acao: "edicao",
      tabela: "TAB_CLIENTE",
      registroId: clienteEditando.id,
      antes: {
        nome: clienteEditando.nome,
        telefone: clienteEditando.telefone,
        cpf_cnpj: clienteEditando.cpf_cnpj,
      },
      depois: { nome, telefone, cpf_cnpj: cpfCnpj },
    })

    setClienteEditando(null)
    recarregar()
  }

  const clientesFiltrados = clientes.filter((c) =>
    `${c.nome} ${c.email} ${c.telefone || ""}`.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>

      <Input
        placeholder="Buscar por nome, email ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          {clientesFiltrados.length === 0 ? (
            <p className="p-6 text-sm text-neutral-400">Nenhum cliente encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-neutral-400">
                    <th className="p-4 font-medium">Nome</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Telefone</th>
                    <th className="p-4 font-medium">CPF/CNPJ</th>
                    <th className="p-4 font-medium text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-neutral-800 last:border-0">
                      <td className="p-4">{cliente.nome}</td>
                      <td className="p-4 text-neutral-400">{cliente.email}</td>
                      <td className="p-4 text-neutral-400">{cliente.telefone || "-"}</td>
                      <td className="p-4 text-neutral-400">{cliente.cpf_cnpj || "-"}</td>
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

      {clienteEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-lg font-semibold">Editando: {clienteEditando.nome}</h2>

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
              </div>
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
                <Button variant="outline" onClick={() => setClienteEditando(null)}>
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
