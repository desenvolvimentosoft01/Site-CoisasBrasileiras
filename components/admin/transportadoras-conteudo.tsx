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

export type Transportadora = {
  id: string
  // Numero curto do cadastro, gerado pelo banco (migration 058) - e por ele
  // que o cliente procura a transportadora no dia a dia.
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
  site_rastreio: string | null
  codigo_servico_frenet: string | null
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
  siteRastreio: "",
  codigoServicoFrenet: "",
  observacao: "",
}

export function TransportadorasConteudo({ transportadorasIniciais }: { transportadorasIniciais: Transportadora[] }) {
  const confirmar = useConfirmar()
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>(transportadorasIniciais)
  const [aba, setAba] = useState("lista")
  const [editando, setEditando] = useState<Transportadora | null>(null)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Transportadora | null>(null)
  const [form, setForm] = useState(VAZIO)
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  function campo<K extends keyof typeof VAZIO>(chave: K, valor: string) {
    setForm((atual) => ({ ...atual, [chave]: valor }))
  }

  async function recarregar() {
    const resposta = await fetch("/api/admin/transportadoras")
    setTransportadoras(await resposta.json())
  }

  function abrirNovo() {
    setEditando(null)
    setLinhaSelecionada(null)
    setForm(VAZIO)
    setAtivo(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(transportadora: Transportadora) {
    setEditando(transportadora)
    setLinhaSelecionada(transportadora.id)
    setForm({
      razaoSocial: transportadora.razao_social,
      nomeFantasia: transportadora.nome_fantasia ?? "",
      cnpjCpf: transportadora.cnpj_cpf ? mascaraCpfCnpj(transportadora.cnpj_cpf) : "",
      inscricaoEstadual: transportadora.inscricao_estadual ?? "",
      telefone: transportadora.telefone ? mascaraTelefone(transportadora.telefone) : "",
      email: transportadora.email ?? "",
      cep: transportadora.cep ? mascaraCEP(transportadora.cep) : "",
      logradouro: transportadora.logradouro ?? "",
      numero: transportadora.numero ?? "",
      complemento: transportadora.complemento ?? "",
      bairro: transportadora.bairro ?? "",
      cidade: transportadora.cidade ?? "",
      estado: transportadora.estado ?? "",
      siteRastreio: transportadora.site_rastreio ?? "",
      codigoServicoFrenet: transportadora.codigo_servico_frenet ?? "",
      observacao: transportadora.observacao ?? "",
    })
    setAtivo(transportadora.ativo)
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
        siteRastreio: editando.site_rastreio ?? "",
        codigoServicoFrenet: editando.codigo_servico_frenet ?? "",
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

    const url = editando ? `/api/admin/transportadoras/${editando.id}` : "/api/admin/transportadoras"
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
      tela: "Transportadoras",
      acao: editando ? "edicao" : "cadastro",
      tabela: "TAB_TRANSPORTADORA",
      registroId: salvo.id,
      antes: editando ? { razao_social: editando.razao_social, ativo: editando.ativo } : null,
      depois: { razao_social: salvo.razao_social, ativo: salvo.ativo },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(transportadora: Transportadora) {
    if (
      !(await confirmar({
        descricao: `Excluir a transportadora "${transportadora.razao_social}"?`,
        destrutivo: true,
        consequencia:
          "Só é possível excluir transportadora sem nenhum pedido despachado por ela. Se já houver histórico de entrega, inative em vez de excluir — assim os pedidos antigos continuam mostrando quem fez a entrega.",
      }))
    )
      return
    const resposta = await fetch(`/api/admin/transportadoras/${transportadora.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir")
      return
    }
    registrarAuditoria({
      tela: "Transportadoras",
      acao: "exclusao",
      tabela: "TAB_TRANSPORTADORA",
      registroId: transportadora.id,
      antes: { razao_social: transportadora.razao_social },
    })
    setLinhaSelecionada(null)
    recarregar()
  }

  const transportadoraSelecionada = transportadoras.find((f) => f.id === linhaSelecionada) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transportadoras</h1>

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
                  onClick: () => transportadoraSelecionada && abrirEdicao(transportadoraSelecionada),
                  disabled: !transportadoraSelecionada,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => transportadoraSelecionada && excluir(transportadoraSelecionada),
                  disabled: !transportadoraSelecionada,
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {transportadoras.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma transportadora cadastrada ainda.</p>
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
                      {transportadoras.map((transportadora) => (
                        <tr
                          key={transportadora.id}
                          onClick={() =>
                            setLinhaSelecionada((atual) => (atual === transportadora.id ? null : transportadora.id))
                          }
                          onDoubleClick={() => abrirEdicao(transportadora)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === transportadora.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4 font-mono text-slate-500">{transportadora.codigo}</td>
                          <td className="p-4">
                            <span className="font-medium">{transportadora.razao_social}</span>
                            {transportadora.nome_fantasia && (
                              <span className="block text-xs text-slate-400">{transportadora.nome_fantasia}</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500">
                            {transportadora.cnpj_cpf ? mascaraCpfCnpj(transportadora.cnpj_cpf) : "-"}
                          </td>
                          <td className="p-4 text-slate-500">
                            {transportadora.telefone ? mascaraTelefone(transportadora.telefone) : "-"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                transportadora.ativo
                                  ? "selo-sucesso"
                                  : "selo-neutro"
                              }`}
                            >
                              {transportadora.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(transportadora)
                              }}
                            >
                              <Icone nome="ver" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirEdicao(transportadora)
                              }}
                            >
                              <Icone nome="editar" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                excluir(transportadora)
                              }}
                            >
                              <Icone nome="excluir" tamanho={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <BarraStatusGrade exibidos={transportadoras.length} total={transportadoras.length} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <p className="px-1 text-sm font-medium text-muted-foreground">
            {editando ? `Editando: ${editando.razao_social}` : "Nova transportadora"}
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
              <div className="space-y-2">
                <Label>Site de rastreio</Label>
                <Input
                  value={form.siteRastreio}
                  onChange={(e) => campo("siteRastreio", e.target.value)}
                  placeholder="Ex: https://rastreamento.correios.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label>Código do serviço (Frenet)</Label>
                <Input
                  value={form.codigoServicoFrenet}
                  onChange={(e) => campo("codigoServicoFrenet", e.target.value)}
                  placeholder="Ex: 04014"
                  title="Código do serviço na sua conta Frenet. É ele que permite validar o rastreio automaticamente."
                />
                <p className="text-xs text-slate-500">
                  Preencha se você usa a Frenet — é esse código que permite validar o rastreio
                  automaticamente. Sem ele, o rastreio continua sendo só anotado.
                </p>
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
        navegacao={montarNavegacaoDetalhe(transportadoras, detalhe, setDetalhe, (a, b) => a.id === b.id)}
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
                { label: "Site de rastreio", valor: detalhe.site_rastreio },
                { label: "Código do serviço (Frenet)", valor: detalhe.codigo_servico_frenet },
                { label: "Observação", valor: detalhe.observacao },
                { label: "Status", valor: detalhe.ativo ? "Ativo" : "Inativo" },
              ]
            : []
        }
      />
    </div>
  )
}
