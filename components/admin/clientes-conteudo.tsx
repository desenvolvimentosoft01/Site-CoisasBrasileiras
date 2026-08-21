"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Pencil, Ban, RotateCcw, Trash2, X, FilePlus, Save, Eraser } from "lucide-react"
import { toast } from "sonner"
import { registrarAuditoria } from "@/lib/auditoria"
import { mascaraTelefone, mascaraCpfCnpj, mascaraCEP } from "@/lib/mascaras"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"
import { Icone } from "@/components/admin/icone"
import { montarNavegacaoDetalhe } from "@/lib/navegacao-detalhe"
import { BarraStatusGrade } from "@/components/admin/barra-status-grade"

export type Cliente = {
  id: string
  // Numero curto do cadastro, gerado pelo banco (migration 058).
  codigo: number
  nome: string
  email: string | null
  telefone: string | null
  cpf_cnpj: string | null
  ativo: boolean
  criado_em: string
  veio_do_site: boolean
}

type ClienteDetalhado = Cliente & {
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
}

const FORM_VAZIO = {
  nome: "",
  email: "",
  telefone: "",
  cpfCnpj: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
}

export function ClientesConteudo({ clientesIniciais }: { clientesIniciais: Cliente[] }) {
  const confirmar = useConfirmar()
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<"ativos" | "inativos" | "todos">("ativos")
  const [aba, setAba] = useState("lista")
  const [clienteEditando, setClienteEditando] = useState<ClienteDetalhado | null>(null)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [detalhe, setDetalhe] = useState<Cliente | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  function campo<K extends keyof typeof FORM_VAZIO>(chave: K, valor: string) {
    setForm((atual) => ({ ...atual, [chave]: valor }))
  }

  async function recarregar() {
    const resposta = await fetch("/api/admin/clientes")
    setClientes(await resposta.json())
  }

  function abrirNovo() {
    setClienteEditando(null)
    setLinhaSelecionada(null)
    setForm(FORM_VAZIO)
    setErro("")
    setAba("formulario")
  }

  async function abrirEdicao(cliente: Cliente) {
    setLinhaSelecionada(cliente.id)
    setAba("formulario")
    setCarregandoDetalhe(true)
    const resposta = await fetch(`/api/admin/clientes/${cliente.id}`)
    const detalhado: ClienteDetalhado = await resposta.json()
    setClienteEditando(detalhado)
    setForm({
      nome: detalhado.nome,
      email: detalhado.email || "",
      telefone: detalhado.telefone ? mascaraTelefone(detalhado.telefone) : "",
      cpfCnpj: detalhado.cpf_cnpj ? mascaraCpfCnpj(detalhado.cpf_cnpj) : "",
      cep: detalhado.cep ? mascaraCEP(detalhado.cep) : "",
      logradouro: detalhado.logradouro || "",
      numero: detalhado.numero || "",
      complemento: detalhado.complemento || "",
      bairro: detalhado.bairro || "",
      cidade: detalhado.cidade || "",
      estado: detalhado.estado || "",
    })
    setErro("")
    setCarregandoDetalhe(false)
  }

  function limpar() {
    if (clienteEditando) {
      setForm({
        nome: clienteEditando.nome,
        email: clienteEditando.email || "",
        telefone: clienteEditando.telefone ? mascaraTelefone(clienteEditando.telefone) : "",
        cpfCnpj: clienteEditando.cpf_cnpj ? mascaraCpfCnpj(clienteEditando.cpf_cnpj) : "",
        cep: clienteEditando.cep ? mascaraCEP(clienteEditando.cep) : "",
        logradouro: clienteEditando.logradouro || "",
        numero: clienteEditando.numero || "",
        complemento: clienteEditando.complemento || "",
        bairro: clienteEditando.bairro || "",
        cidade: clienteEditando.cidade || "",
        estado: clienteEditando.estado || "",
      })
    } else {
      setForm(FORM_VAZIO)
    }
    setErro("")
  }

  // Autopreenche o endereco a partir do CEP (BrasilAPI, gratuita e sem
  // necessidade de chave) - mesmo padrao ja usado no checkout do site.
  async function handleCepChange(valor: string) {
    const formatado = mascaraCEP(valor)
    campo("cep", formatado)

    const digitos = formatado.replace(/\D/g, "")
    if (digitos.length !== 8) return

    setBuscandoCep(true)
    try {
      const resposta = await fetch(`https://brasilapi.com.br/api/cep/v1/${digitos}`)
      if (resposta.ok) {
        const dados = await resposta.json()
        setForm((atual) => ({
          ...atual,
          logradouro: dados.street || atual.logradouro,
          bairro: dados.neighborhood || atual.bairro,
          cidade: dados.city || atual.cidade,
          estado: dados.state || atual.estado,
        }))
      }
    } catch {
      // Busca falhou - o usuario preenche o endereco na mao, nao trava o cadastro.
    } finally {
      setBuscandoCep(false)
    }
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    // Editar so mexe em dados cadastrais (nao mexe no e-mail/senha de login do
    // cliente do site); criar aceita e-mail opcional pra contato de balcao.
    const url = clienteEditando ? `/api/admin/clientes/${clienteEditando.id}` : "/api/admin/clientes"
    const method = clienteEditando ? "PUT" : "POST"
    const corpo = {
      nome: form.nome,
      email: form.email,
      telefone: form.telefone.replace(/\D/g, "") || null,
      cpf_cnpj: form.cpfCnpj.replace(/\D/g, "") || null,
      ativo: clienteEditando?.ativo ?? true,
      cep: form.cep.replace(/\D/g, "") || null,
      logradouro: form.logradouro || null,
      numero: form.numero || null,
      complemento: form.complemento || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
    }

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
      depois: { nome: form.nome, telefone: form.telefone, cpf_cnpj: form.cpfCnpj },
    })

    setAba("lista")
    setClienteEditando(null)
    recarregar()
  }

  async function alternarAtivo(cliente: Cliente) {
    const novoStatus = !cliente.ativo
    const acao = novoStatus ? "reativar" : "inativar"
    if (
      !(await confirmar({
        descricao: `Quer mesmo ${acao} o cliente "${cliente.nome}"?`,
        consequencia: cliente.ativo
          ? "O cliente perde o acesso à conta na loja e não consegue mais comprar. O histórico de pedidos dele é mantido."
          : "O cliente volta a acessar a conta e a comprar normalmente.",
      }))
    )
      return

    const resposta = await fetch(`/api/admin/clientes/${cliente.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: cliente.nome,
        telefone: cliente.telefone,
        cpf_cnpj: cliente.cpf_cnpj,
        ativo: novoStatus,
      }),
    })

    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao atualizar status")
      return
    }

    registrarAuditoria({
      tela: "Clientes",
      acao: novoStatus ? "ativacao" : "inativacao",
      tabela: "TAB_CLIENTE",
      registroId: cliente.id,
      antes: { ativo: cliente.ativo },
      depois: { ativo: novoStatus },
    })

    recarregar()
  }

  // So tem efeito de fato quando o cliente nunca teve pedido - se ja tiver
  // historico de venda vinculado, a API recusa (23503) e pede pra inativar
  // em vez de excluir, pra nao perder o vinculo do pedido com o cliente.
  async function excluir(cliente: Cliente) {
    if (!(await confirmar({ descricao: `Excluir o cliente "${cliente.nome}"?`, destrutivo: true, consequencia: "O cadastro e os endereços dele são apagados. Só funciona se ele nunca tiver feito nenhum pedido — se já tiver, prefira inativar." }))) return

    const resposta = await fetch(`/api/admin/clientes/${cliente.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir")
      return
    }

    registrarAuditoria({
      tela: "Clientes",
      acao: "exclusao",
      tabela: "TAB_CLIENTE",
      registroId: cliente.id,
      antes: { nome: cliente.nome },
      depois: null,
    })

    setLinhaSelecionada(null)
    recarregar()
  }

  const clientesFiltrados = clientes
    .filter((c) => {
      if (filtroStatus === "ativos") return c.ativo
      if (filtroStatus === "inativos") return !c.ativo
      return true
    })
    .filter((c) => `${c.nome} ${c.email || ""} ${c.telefone || ""}`.toLowerCase().includes(busca.toLowerCase()))

  const clienteSelecionado = clientes.find((c) => c.id === linhaSelecionada) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList>
          <TabsTrigger value="lista">
            <Icone nome="grade" tamanho={15} className="mr-1.5" />
            Lista
          </TabsTrigger>
          {(aba === "formulario" || clienteEditando) && (
            <TabsTrigger value="formulario">
              <Icone nome="editar" tamanho={15} className="mr-1.5" />
              {clienteEditando ? "Editando" : "Novo cliente"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="lista" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-sm"
            />
            {(busca || filtroStatus !== "ativos") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBusca("")
                  setFiltroStatus("ativos")
                }}
              >
                <X size={14} className="mr-1" />
                Limpar filtros
              </Button>
            )}
            <Tabs value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
              <TabsList>
                <TabsTrigger value="ativos">Ativos</TabsTrigger>
                <TabsTrigger value="inativos">Inativos</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="overflow-hidden py-0">
            <BarraFerramentas
              botoes={[
                { label: "Novo", icon: FilePlus, onClick: abrirNovo, variante: "primary" },
                {
                  label: "Editar",
                  icon: Pencil,
                  onClick: () => clienteSelecionado && abrirEdicao(clienteSelecionado),
                  disabled: !clienteSelecionado,
                },
                {
                  label: clienteSelecionado?.ativo === false ? "Reativar" : "Inativar",
                  icon: clienteSelecionado?.ativo === false ? RotateCcw : Ban,
                  onClick: () => clienteSelecionado && alternarAtivo(clienteSelecionado),
                  disabled: !clienteSelecionado,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => clienteSelecionado && excluir(clienteSelecionado),
                  disabled: !clienteSelecionado,
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {clientesFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhum cliente encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-4 font-medium">Cód.</th>
                        <th className="p-4 font-medium">Nome</th>
                        <th className="p-4 font-medium">Origem</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Telefone</th>
                        <th className="p-4 font-medium">CPF/CNPJ</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesFiltrados.map((cliente) => (
                        <tr
                          key={cliente.id}
                          onClick={() =>
                            setLinhaSelecionada((atual) => (atual === cliente.id ? null : cliente.id))
                          }
                          onDoubleClick={() => abrirEdicao(cliente)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === cliente.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4 font-mono text-slate-500">{cliente.codigo}</td>
                          <td className="p-4">{cliente.nome}</td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                cliente.veio_do_site
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-amber-600/20 text-amber-400"
                              }`}
                            >
                              {cliente.veio_do_site ? "Site" : "Balcão"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{cliente.email || "-"}</td>
                          <td className="p-4 text-slate-500">{cliente.telefone || "-"}</td>
                          <td className="p-4 text-slate-500">{cliente.cpf_cnpj || "-"}</td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                cliente.ativo
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {cliente.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(cliente)
                              }}
                            >
                              <Icone nome="ver" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirEdicao(cliente)
                              }}
                            >
                              <Icone nome="editar" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                alternarAtivo(cliente)
                              }}
                              title={cliente.ativo ? "Inativar cliente" : "Reativar cliente"}
                            >
                              {cliente.ativo ? (
                                <Ban size={16} className="text-red-500" />
                              ) : (
                                <RotateCcw size={16} className="text-emerald-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                excluir(cliente)
                              }}
                              title="Excluir cliente (só se nunca teve pedido)"
                            >
                              <Icone nome="excluir" tamanho={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <BarraStatusGrade exibidos={clientesFiltrados.length} total={clientes.length} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <p className="px-1 text-sm font-medium text-muted-foreground">
            {clienteEditando ? `Editando: ${clienteEditando.nome}` : "Novo cliente"}
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <BarraFerramentas
              botoes={[
                {
                  label: "Gravar",
                  icon: Save,
                  onClick: salvar,
                  variante: "success",
                  disabled: salvando || carregandoDetalhe || !form.nome.trim(),
                },
                { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
                { label: "Cancelar", icon: X, onClick: () => setAba("lista"), variante: "danger" },
              ]}
            />
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}

          {carregandoDetalhe ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <p className="text-sm font-medium text-muted-foreground">Dados cadastrais</p>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={form.nome} onChange={(e) => campo("nome", e.target.value)} autoFocus />
                  </div>
                  {!clienteEditando && (
                    <div className="space-y-2">
                      <Label>E-mail (opcional)</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => campo("email", e.target.value)}
                        placeholder="Só se o cliente for usar o site"
                      />
                    </div>
                  )}
                  <div className="grid items-start gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={form.telefone}
                        onChange={(e) => campo("telefone", mascaraTelefone(e.target.value))}
                        inputMode="tel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF/CNPJ</Label>
                      <Input
                        value={form.cpfCnpj}
                        onChange={(e) => campo("cpfCnpj", mascaraCpfCnpj(e.target.value))}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 pt-6">
                  <p className="text-sm font-medium text-muted-foreground">Endereço (opcional)</p>
                  <div className="grid items-start gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>CEP</Label>
                      <Input
                        value={form.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        inputMode="numeric"
                        placeholder={buscandoCep ? "Buscando..." : "00000-000"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input value={form.numero} onChange={(e) => campo("numero", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logradouro</Label>
                    <Input value={form.logradouro} onChange={(e) => campo("logradouro", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input value={form.complemento} onChange={(e) => campo("complemento", e.target.value)} />
                  </div>
                  <div className="grid items-start gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Bairro</Label>
                      <Input value={form.bairro} onChange={(e) => campo("bairro", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input value={form.cidade} onChange={(e) => campo("cidade", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Input
                        value={form.estado}
                        onChange={(e) => campo("estado", e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="UF"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ModalDetalhe
        navegacao={montarNavegacaoDetalhe(clientesFiltrados, detalhe, setDetalhe, (a, b) => a.id === b.id)}
        aoEditar={detalhe ? () => { const alvo = detalhe; setDetalhe(null); abrirEdicao(alvo) } : undefined}
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe?.nome ?? ""}
        campos={
          detalhe
            ? [
                { label: "Origem", valor: detalhe.veio_do_site ? "Site" : "Balcão" },
                { label: "Email", valor: detalhe.email },
                { label: "Telefone", valor: detalhe.telefone ? mascaraTelefone(detalhe.telefone) : null },
                { label: "CPF/CNPJ", valor: detalhe.cpf_cnpj ? mascaraCpfCnpj(detalhe.cpf_cnpj) : null },
                { label: "Status", valor: detalhe.ativo ? "Ativo" : "Inativo" },
                { label: "Cliente desde", valor: new Date(detalhe.criado_em).toLocaleDateString("pt-BR") },
              ]
            : []
        }
      />
    </div>
  )
}
