"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputSenha } from "@/components/ui/input-senha"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Pencil, FilePlus, Save, Eraser, X } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"
import { toast } from "sonner"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"
import { Icone } from "@/components/admin/icone"
import { montarNavegacaoDetalhe } from "@/lib/navegacao-detalhe"
import { BarraStatusGrade } from "@/components/admin/barra-status-grade"

export type Usuario = {
  id: string
  nome: string
  email: string
  usuario: string | null
  papel: "admin" | "operador"
  ativo: boolean
  criado_em: string
  ultimo_login: string | null
}

export function UsuariosConteudo({ usuariosIniciais }: { usuariosIniciais: Usuario[] }) {
  const confirmar = useConfirmar()
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais)
  const [aba, setAba] = useState("lista")
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Usuario | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [usuarioLogin, setUsuarioLogin] = useState("")
  const [senha, setSenha] = useState("")
  const [papel, setPapel] = useState<"admin" | "operador">("operador")
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function recarregar() {
    const resposta = await fetch("/api/admin/usuarios")
    const dados = await resposta.json()
    setUsuarios(Array.isArray(dados) ? dados : [])
  }

  function abrirNovo() {
    setUsuarioEditando(null)
    setLinhaSelecionada(null)
    setNome("")
    setEmail("")
    setUsuarioLogin("")
    setSenha("")
    setPapel("operador")
    setAtivo(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(usuario: Usuario) {
    setUsuarioEditando(usuario)
    setLinhaSelecionada(usuario.id)
    setNome(usuario.nome)
    setEmail(usuario.email)
    setUsuarioLogin(usuario.usuario || "")
    setSenha("")
    setPapel(usuario.papel)
    setAtivo(usuario.ativo)
    setErro("")
    setAba("formulario")
  }

  function limpar() {
    if (usuarioEditando) {
      setNome(usuarioEditando.nome)
      setEmail(usuarioEditando.email)
      setUsuarioLogin(usuarioEditando.usuario || "")
      setSenha("")
      setPapel(usuarioEditando.papel)
      setAtivo(usuarioEditando.ativo)
    } else {
      setNome("")
      setEmail("")
      setUsuarioLogin("")
      setSenha("")
      setPapel("operador")
      setAtivo(true)
    }
    setErro("")
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const url = usuarioEditando ? `/api/admin/usuarios/${usuarioEditando.id}` : "/api/admin/usuarios"
    const method = usuarioEditando ? "PUT" : "POST"
    const corpo = usuarioEditando
      ? { nome, papel, ativo, usuario: usuarioLogin, senha: senha || undefined }
      : { nome, email, senha, papel, usuario: usuarioLogin }

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

    // Nunca inclui a senha no log de auditoria, mesmo que tenha sido trocada.
    const salvo = await resposta.json()
    registrarAuditoria({
      tela: "Usuários",
      acao: usuarioEditando ? "edicao" : "cadastro",
      tabela: "TAB_USUARIO_ADMIN",
      registroId: usuarioEditando?.id ?? salvo.id,
      antes: usuarioEditando
        ? {
            nome: usuarioEditando.nome,
            papel: usuarioEditando.papel,
            ativo: usuarioEditando.ativo,
            usuario: usuarioEditando.usuario,
          }
        : null,
      depois: { nome, papel, ativo, usuario: usuarioLogin },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(usuario: Usuario) {
    if (!(await confirmar({ descricao: `Excluir o usuário "${usuario.nome}"?`, destrutivo: true, consequencia: "A pessoa perde o acesso ao painel na hora. O histórico dela na Auditoria continua guardado." }))) return
    const resposta = await fetch(`/api/admin/usuarios/${usuario.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      toast.error(dados.erro || "Erro ao excluir")
      return
    }
    registrarAuditoria({
      tela: "Usuários",
      acao: "exclusao",
      tabela: "TAB_USUARIO_ADMIN",
      registroId: usuario.id,
      antes: { nome: usuario.nome, papel: usuario.papel },
    })
    setLinhaSelecionada(null)
    recarregar()
  }

  const usuarioSelecionado = usuarios.find((u) => u.id === linhaSelecionada) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Usuários</h1>

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
                  onClick: () => usuarioSelecionado && abrirEdicao(usuarioSelecionado),
                  disabled: !usuarioSelecionado,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => usuarioSelecionado && excluir(usuarioSelecionado),
                  disabled: !usuarioSelecionado,
                  variante: "danger",
                },
              ]}
            />
            <CardContent className="p-0">
              {usuarios.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhum usuário cadastrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="cabecalho-grade border-b border-slate-700">
                        <th className="p-4 font-medium">Nome</th>
                        <th className="p-4 font-medium">Usuário</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Papel</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Último acesso</th>
                        <th className="p-4 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr
                          key={usuario.id}
                          onClick={() =>
                            setLinhaSelecionada((atual) => (atual === usuario.id ? null : usuario.id))
                          }
                          onDoubleClick={() => abrirEdicao(usuario)}
                          className={`cursor-pointer border-b border-slate-200 last:border-0 ${
                            linhaSelecionada === usuario.id ? "bg-amber-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4">{usuario.nome}</td>
                          <td className="p-4 font-mono text-xs text-slate-500">{usuario.usuario || "-"}</td>
                          <td className="p-4 text-slate-500">{usuario.email}</td>
                          <td className="p-4 capitalize text-slate-500">{usuario.papel}</td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                usuario.ativo
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {usuario.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {usuario.ultimo_login
                              ? new Date(usuario.ultimo_login).toLocaleString("pt-BR")
                              : "Nunca acessou"}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetalhe(usuario)
                              }}
                            >
                              <Icone nome="ver" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirEdicao(usuario)
                              }}
                            >
                              <Icone nome="editar" tamanho={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                excluir(usuario)
                              }}
                            >
                              <Icone nome="excluir" tamanho={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <BarraStatusGrade exibidos={usuarios.length} total={usuarios.length} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <p className="px-1 text-sm font-medium text-muted-foreground">
            {usuarioEditando ? `Editando: ${usuarioEditando.nome}` : "Novo usuário"}
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <BarraFerramentas
              botoes={[
                {
                  label: "Gravar",
                  icon: Save,
                  onClick: salvar,
                  variante: "success",
                  disabled: salvando || !nome.trim() || (!usuarioEditando && (!email.trim() || !senha)),
                },
                { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
                { label: "Cancelar", icon: X, onClick: () => setAba("lista"), variante: "danger" },
              ]}
            />
          </div>

          <Card>
            <CardContent className="max-w-lg space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!usuarioEditando}
                />
              </div>

              <div className="space-y-2">
                <Label>Usuário de login (opcional)</Label>
                <Input
                  value={usuarioLogin}
                  onChange={(e) => setUsuarioLogin(e.target.value)}
                  placeholder="Ex: joao.silva - se vazio, entra só com o e-mail"
                />
              </div>

              <div className="space-y-2">
                <Label>{usuarioEditando ? "Nova senha (deixe em branco para manter)" : "Senha"}</Label>
                <InputSenha value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Papel</Label>
                <Select value={papel} onValueChange={(v) => setPapel(v as "admin" | "operador")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {usuarioEditando && (
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch checked={ativo} onCheckedChange={setAtivo} />
                </div>
              )}

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModalDetalhe
        navegacao={montarNavegacaoDetalhe(usuarios, detalhe, setDetalhe, (a, b) => a.id === b.id)}
        aoEditar={detalhe ? () => { const alvo = detalhe; setDetalhe(null); abrirEdicao(alvo) } : undefined}
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe?.nome ?? ""}
        campos={
          detalhe
            ? [
                { label: "Usuário", valor: detalhe.usuario },
                { label: "Email", valor: detalhe.email },
                { label: "Papel", valor: detalhe.papel },
                { label: "Status", valor: detalhe.ativo ? "Ativo" : "Inativo" },
                {
                  label: "Último acesso",
                  valor: detalhe.ultimo_login ? new Date(detalhe.ultimo_login).toLocaleString("pt-BR") : "Nunca acessou",
                },
                { label: "Criado em", valor: new Date(detalhe.criado_em).toLocaleDateString("pt-BR") },
              ]
            : []
        }
      />
    </div>
  )
}
