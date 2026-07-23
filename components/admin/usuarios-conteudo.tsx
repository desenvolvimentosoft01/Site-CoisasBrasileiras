"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Trash2, Pencil, Plus, List } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"

export type Usuario = {
  id: string
  nome: string
  email: string
  papel: "admin" | "operador"
  ativo: boolean
  criado_em: string
}

export function UsuariosConteudo({ usuariosIniciais }: { usuariosIniciais: Usuario[] }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais)
  const [aba, setAba] = useState("lista")
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
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
    setNome("")
    setEmail("")
    setSenha("")
    setPapel("operador")
    setAtivo(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(usuario: Usuario) {
    setUsuarioEditando(usuario)
    setNome(usuario.nome)
    setEmail(usuario.email)
    setSenha("")
    setPapel(usuario.papel)
    setAtivo(usuario.ativo)
    setErro("")
    setAba("formulario")
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const url = usuarioEditando ? `/api/admin/usuarios/${usuarioEditando.id}` : "/api/admin/usuarios"
    const method = usuarioEditando ? "PUT" : "POST"
    const corpo = usuarioEditando
      ? { nome, papel, ativo, senha: senha || undefined }
      : { nome, email, senha, papel }

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
      tela: "Usuarios",
      acao: usuarioEditando ? "edicao" : "cadastro",
      tabela: "TAB_USUARIO_ADMIN",
      registroId: usuarioEditando?.id ?? salvo.id,
      antes: usuarioEditando
        ? { nome: usuarioEditando.nome, papel: usuarioEditando.papel, ativo: usuarioEditando.ativo }
        : null,
      depois: { nome, papel, ativo },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(usuario: Usuario) {
    if (!confirm(`Excluir o usuario "${usuario.nome}"?`)) return
    const resposta = await fetch(`/api/admin/usuarios/${usuario.id}`, { method: "DELETE" })
    if (!resposta.ok) {
      const dados = await resposta.json()
      alert(dados.erro || "Erro ao excluir")
      return
    }
    registrarAuditoria({
      tela: "Usuarios",
      acao: "exclusao",
      tabela: "TAB_USUARIO_ADMIN",
      registroId: usuario.id,
      antes: { nome: usuario.nome, papel: usuario.papel },
    })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Usuarios</h1>

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
              Novo usuario
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {usuarios.length === 0 ? (
                <p className="p-6 text-sm text-neutral-400">Nenhum usuario cadastrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-left text-neutral-400">
                        <th className="p-4 font-medium">Nome</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Papel</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="border-b border-neutral-800 last:border-0">
                          <td className="p-4">{usuario.nome}</td>
                          <td className="p-4 text-neutral-400">{usuario.email}</td>
                          <td className="p-4 capitalize text-neutral-400">{usuario.papel}</td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                usuario.ativo
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-neutral-700/40 text-neutral-400"
                              }`}
                            >
                              {usuario.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(usuario)}>
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon-lg" onClick={() => excluir(usuario)}>
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
              {usuarioEditando ? `Editando: ${usuarioEditando.nome}` : "Novo usuario"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAba("lista")}>
                Cancelar
              </Button>
              <Button
                onClick={salvar}
                disabled={
                  salvando ||
                  !nome.trim() ||
                  (!usuarioEditando && (!email.trim() || !senha))
                }
              >
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
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
                <Label>{usuarioEditando ? "Nova senha (deixe em branco para manter)" : "Senha"}</Label>
                <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
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
    </div>
  )
}
