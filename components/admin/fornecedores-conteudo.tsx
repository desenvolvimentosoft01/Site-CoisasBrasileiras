"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, Plus, List } from "lucide-react"
import { mascaraCpfCnpj, mascaraTelefone, mascaraCEP } from "@/lib/mascaras"
import { registrarAuditoria } from "@/lib/auditoria"

export type Fornecedor = {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj_cpf: string | null
  telefone: string | null
  email: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  observacao: string | null
  ativo: boolean
  criado_em: string
}

const VAZIO = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpjCpf: "",
  telefone: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  observacao: "",
}

export function FornecedoresConteudo({ fornecedoresIniciais }: { fornecedoresIniciais: Fornecedor[] }) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(fornecedoresIniciais)
  const [aba, setAba] = useState("lista")
  const [editando, setEditando] = useState<Fornecedor | null>(null)
  const [form, setForm] = useState(VAZIO)
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  function campo<K extends keyof typeof VAZIO>(chave: K, valor: string) {
    setForm((atual) => ({ ...atual, [chave]: valor }))
  }

  async function recarregar() {
    const resposta = await fetch("/api/admin/fornecedores")
    setFornecedores(await resposta.json())
  }

  function abrirNovo() {
    setEditando(null)
    setForm(VAZIO)
    setAtivo(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(fornecedor: Fornecedor) {
    setEditando(fornecedor)
    setForm({
      razaoSocial: fornecedor.razao_social,
      nomeFantasia: fornecedor.nome_fantasia ?? "",
      cnpjCpf: fornecedor.cnpj_cpf ? mascaraCpfCnpj(fornecedor.cnpj_cpf) : "",
      telefone: fornecedor.telefone ? mascaraTelefone(fornecedor.telefone) : "",
      email: fornecedor.email ?? "",
      cep: fornecedor.cep ? mascaraCEP(fornecedor.cep) : "",
      logradouro: fornecedor.logradouro ?? "",
      numero: fornecedor.numero ?? "",
      complemento: fornecedor.complemento ?? "",
      bairro: fornecedor.bairro ?? "",
      cidade: fornecedor.cidade ?? "",
      estado: fornecedor.estado ?? "",
      observacao: fornecedor.observacao ?? "",
    })
    setAtivo(fornecedor.ativo)
    setErro("")
    setAba("formulario")
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const corpo = {
      ...form,
      cnpjCpf: form.cnpjCpf.replace(/\D/g, "") || null,
      telefone: form.telefone.replace(/\D/g, "") || null,
      cep: form.cep.replace(/\D/g, "") || null,
      ativo,
    }

    const url = editando ? `/api/admin/fornecedores/${editando.id}` : "/api/admin/fornecedores"
    const method = editando ? "PUT" : "POST"

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
      tela: "Fornecedores",
      acao: editando ? "edicao" : "cadastro",
      tabela: "TAB_FORNECEDOR",
      registroId: salvo.id,
      antes: editando ? { razao_social: editando.razao_social, ativo: editando.ativo } : null,
      depois: { razao_social: salvo.razao_social, ativo: salvo.ativo },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(fornecedor: Fornecedor) {
    if (!confirm(`Excluir o fornecedor "${fornecedor.razao_social}"?`)) return
    const resposta = await fetch(`/api/admin/fornecedores/${fornecedor.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      alert(dados.erro || "Erro ao excluir")
      return
    }
    registrarAuditoria({
      tela: "Fornecedores",
      acao: "exclusao",
      tabela: "TAB_FORNECEDOR",
      registroId: fornecedor.id,
      antes: { razao_social: fornecedor.razao_social },
    })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Fornecedores</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lista">
              <List size={14} className="mr-1.5" />
              Grade
            </TabsTrigger>
            <TabsTrigger value="formulario">
              <Plus size={14} className="mr-1.5" />
              Cadastro
            </TabsTrigger>
          </TabsList>
          {aba === "lista" && (
            <Button onClick={abrirNovo}>
              <Plus size={16} className="mr-2" />
              Novo fornecedor
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {fornecedores.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhum fornecedor cadastrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Razao social</th>
                        <th className="p-4 font-medium">CNPJ/CPF</th>
                        <th className="p-4 font-medium">Telefone</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fornecedores.map((fornecedor) => (
                        <tr key={fornecedor.id} className="border-b border-slate-200 last:border-0">
                          <td className="p-4">
                            <span className="font-medium">{fornecedor.razao_social}</span>
                            {fornecedor.nome_fantasia && (
                              <span className="block text-xs text-slate-400">{fornecedor.nome_fantasia}</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500">
                            {fornecedor.cnpj_cpf ? mascaraCpfCnpj(fornecedor.cnpj_cpf) : "-"}
                          </td>
                          <td className="p-4 text-slate-500">
                            {fornecedor.telefone ? mascaraTelefone(fornecedor.telefone) : "-"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                fornecedor.ativo
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {fornecedor.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(fornecedor)}>
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon-lg" onClick={() => excluir(fornecedor)}>
                              <Trash2 size={16} className="text-red-500" />
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
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">
              {editando ? `Editando: ${editando.razao_social}` : "Novo fornecedor"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAba("lista")}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando || !form.razaoSocial.trim()}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Razao social</Label>
                <Input value={form.razaoSocial} onChange={(e) => campo("razaoSocial", e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Nome fantasia</Label>
                <Input value={form.nomeFantasia} onChange={(e) => campo("nomeFantasia", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ/CPF</Label>
                <Input
                  value={form.cnpjCpf}
                  onChange={(e) => campo("cnpjCpf", mascaraCpfCnpj(e.target.value))}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => campo("telefone", mascaraTelefone(e.target.value))}
                  inputMode="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => campo("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={form.cep}
                  onChange={(e) => campo("cep", mascaraCEP(e.target.value))}
                  inputMode="numeric"
                  className="max-w-40"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Logradouro</Label>
                <Input value={form.logradouro} onChange={(e) => campo("logradouro", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Numero</Label>
                <Input value={form.numero} onChange={(e) => campo("numero", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input value={form.complemento} onChange={(e) => campo("complemento", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={(e) => campo("bairro", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => campo("cidade", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estado (UF)</Label>
                <Input
                  value={form.estado}
                  onChange={(e) => campo("estado", e.target.value.toUpperCase().slice(0, 2))}
                  className="max-w-20"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Observacao</Label>
                <Input value={form.observacao} onChange={(e) => campo("observacao", e.target.value)} />
              </div>

              {editando && (
                <div className="flex items-center justify-between sm:col-span-2">
                  <Label>Ativo</Label>
                  <Switch checked={ativo} onCheckedChange={setAtivo} />
                </div>
              )}

              {erro && <p className="text-sm text-red-500 sm:col-span-2">{erro}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
