"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, FilePlus, Save, Eraser, X } from "lucide-react"
import { mascaraCpfCnpj, mascaraTelefone, mascaraCEP } from "@/lib/mascaras"
import { registrarAuditoria } from "@/lib/auditoria"
import { toast } from "sonner"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"
import { Icone } from "@/components/admin/icone"
import { montarNavegacaoDetalhe } from "@/lib/navegacao-detalhe"
import { BarraStatusGrade } from "@/components/admin/barra-status-grade"

export type Fornecedor = {
  id: string
  // Numero curto do cadastro, gerado pelo banco (migration 058) - e por ele
  // que o cliente procura o fornecedor no dia a dia.
  codigo: number
  razao_social: string
  nome_fantasia: string | null
  cnpj_cpf: string | null
  inscricao_estadual: string | null
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
  inscricaoEstadual: "",
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
  const confirmar = useConfirmar()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(fornecedoresIniciais)
  const [aba, setAba] = useState("lista")
  const [editando, setEditando] = useState<Fornecedor | null>(null)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Fornecedor | null>(null)
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
    setLinhaSelecionada(null)
    setForm(VAZIO)
    setAtivo(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(fornecedor: Fornecedor) {
    setEditando(fornecedor)
    setLinhaSelecionada(fornecedor.id)
    setForm({
      razaoSocial: fornecedor.razao_social,
      nomeFantasia: fornecedor.nome_fantasia ?? "",
      cnpjCpf: fornecedor.cnpj_cpf ? mascaraCpfCnpj(fornecedor.cnpj_cpf) : "",
      inscricaoEstadual: fornecedor.inscricao_estadual ?? "",
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

  function limpar() {
    if (editando) {
      setForm({
        razaoSocial: editando.razao_social,
        nomeFantasia: editando.nome_fantasia ?? "",
        cnpjCpf: editando.cnpj_cpf ? mascaraCpfCnpj(editando.cnpj_cpf) : "",
        inscricaoEstadual: editando.inscricao_estadual ?? "",
        telefone: editando.telefone ? mascaraTelefone(editando.telefone) : "",
        email: editando.email ?? "",
        cep: editando.cep ? mascaraCEP(editando.cep) : "",
        logradouro: editando.logradouro ?? "",
        numero: editando.numero ?? "",
        complemento: editando.complemento ?? "",
        bairro: editando.bairro ?? "",
        cidade: editando.cidade ?? "",
        estado: editando.estado ?? "",
        observacao: editando.observacao ?? "",
      })
      setAtivo(editando.ativo)
    } else {
      setForm(VAZIO)
      setAtivo(true)
    }
    setErro("")
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
    if (!(await confirmar({ descricao: `Excluir o fornecedor "${fornecedor.razao_social}"?`, destrutivo: true, consequencia: "Só é possível excluir fornecedor sem nenhuma compra lançada. Se já houver histórico, inative em vez de excluir." }))) return
    const resposta = await fetch(`/api/admin/fornecedores/${fornecedor.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir")
      return
    }
    registrarAuditoria({
      tela: "Fornecedores",
      acao: "exclusao",
      tabela: "TAB_FORNECEDOR",
      registroId: fornecedor.id,
      antes: { razao_social: fornecedor.razao_social },
    })
    setLinhaSelecionada(null)
    recarregar()
  }

  const fornecedorSelecionado = fornecedores.find((f) => f.id === linhaSelecionada) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Fornecedores</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList>
          <TabsTrigger value="lista">
            <Icone nome="grade" tamanho={15} className="mr-1.5" />
            Grade
          </TabsTrigger>
          <TabsTrigger value="formulario">
            <Icone nome="novo" tamanho={15} className="mr-1.5" />
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4">
          <Card className="overflow-hidden py-0">
            <BarraFerramentas
              botoes={[
                { label: "Novo", icon: FilePlus, onClick: abrirNovo, variante: "primary" },
                {
                  label: "Editar",
                  icon: Pencil,
                  onClick: () => fornecedorSelecionado && abrirEdicao(fornecedorSelecionado),
                  disabled: !fornecedorSelecionado,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => fornecedorSelecionado && excluir(fornecedorSelecionado),
                  disabled: !fornecedorSelecionado,
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {fornecedores.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhum fornecedor cadastrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-4 font-medium">Cód.</th>
                        <th className="p-4 font-medium">Razão social</th>
                        <th className="p-4 font-medium">CNPJ/CPF</th>
                        <th className="p-4 font-medium">Telefone</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fornecedores.map((fornecedor) => (
                        <tr
                          key={fornecedor.id}
                          onClick={() =>
                            setLinhaSelecionada((atual) => (atual === fornecedor.id ? null : fornecedor.id))
                          }
                          onDoubleClick={() => abrirEdicao(fornecedor)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === fornecedor.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4 font-mono text-slate-500">{fornecedor.codigo}</td>
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
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(fornecedor)
                              }}
                            >
                              <Icone nome="ver" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirEdicao(fornecedor)
                              }}
                            >
                              <Icone nome="editar" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                excluir(fornecedor)
                              }}
                            >
                              <Icone nome="excluir" tamanho={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <BarraStatusGrade exibidos={fornecedores.length} total={fornecedores.length} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <p className="px-1 text-sm font-medium text-muted-foreground">
            {editando ? `Editando: ${editando.razao_social}` : "Novo fornecedor"}
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <BarraFerramentas
              botoes={[
                {
                  label: "Gravar",
                  icon: Save,
                  onClick: salvar,
                  variante: "success",
                  disabled: salvando || !form.razaoSocial.trim(),
                },
                { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
                { label: "Cancelar", icon: X, onClick: () => setAba("lista"), variante: "danger" },
              ]}
            />
          </div>

          <Card>
            <CardContent className="grid items-start gap-4 pt-6 sm:grid-cols-2">
              {/* readOnly e nao disabled: o codigo e gerado pelo sistema e nao
                  se edita, mas precisa dar pra selecionar e copiar - campo
                  desabilitado nem sempre deixa marcar o texto. No cadastro
                  novo ainda nao existe numero: quem gera e o banco, ao salvar. */}
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={editando ? String(editando.codigo) : "Gerado ao salvar"}
                  readOnly
                  className="bg-slate-50 text-slate-500"
                  title="Código do cadastro, gerado pelo sistema"
                />
              </div>
              <div className="space-y-2">
                <Label>Razão social</Label>
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
                <Label>Inscrição Estadual</Label>
                <Input
                  value={form.inscricaoEstadual}
                  onChange={(e) => campo("inscricaoEstadual", e.target.value)}
                  placeholder="Isento, se não contribuinte"
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
                <Label>Número</Label>
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
                <Label>Observação</Label>
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

      <ModalDetalhe
        navegacao={montarNavegacaoDetalhe(fornecedores, detalhe, setDetalhe, (a, b) => a.id === b.id)}
        aoEditar={detalhe ? () => { const alvo = detalhe; setDetalhe(null); abrirEdicao(alvo) } : undefined}
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe?.razao_social ?? ""}
        campos={
          detalhe
            ? [
                { label: "Nome fantasia", valor: detalhe.nome_fantasia },
                { label: "CNPJ/CPF", valor: detalhe.cnpj_cpf ? mascaraCpfCnpj(detalhe.cnpj_cpf) : null },
                { label: "Inscrição Estadual", valor: detalhe.inscricao_estadual },
                { label: "Telefone", valor: detalhe.telefone ? mascaraTelefone(detalhe.telefone) : null },
                { label: "E-mail", valor: detalhe.email },
                {
                  label: "Endereço",
                  valor: [detalhe.logradouro, detalhe.numero, detalhe.bairro, detalhe.cidade, detalhe.estado]
                    .filter(Boolean)
                    .join(", ") || null,
                },
                { label: "Observação", valor: detalhe.observacao },
                { label: "Status", valor: detalhe.ativo ? "Ativo" : "Inativo" },
              ]
            : []
        }
      />
    </div>
  )
}
