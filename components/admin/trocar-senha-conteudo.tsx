"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { InputSenha } from "@/components/ui/input-senha"
import { toast } from "sonner"

// Troca da propria senha. A mesma tela serve pros dois casos: a obrigatoria
// do primeiro acesso (senha que outra pessoa definiu) e a voluntaria de quem
// so quer trocar. O que muda e o texto - o fluxo e identico.
export function TrocarSenhaConteudo({ obrigatoria }: { obrigatoria: boolean }) {
  const router = useRouter()
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()

    // Conferencia da digitacao acontece aqui, e nao no servidor: e erro de
    // digitacao, nao de regra - nao faz sentido ir ate o banco pra descobrir.
    if (novaSenha !== confirmacao) {
      toast.error("A confirmação não confere com a nova senha")
      return
    }

    setSalvando(true)
    const resposta = await fetch("/api/admin/trocar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    })
    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null)
      toast.error(dados?.erro ?? "Não foi possível trocar a senha")
      return
    }

    toast.success("Senha alterada. Da próxima vez, entre com a nova senha.")
    router.push("/admin/dashboard")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {obrigatoria ? "Crie a sua senha" : "Trocar minha senha"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {obrigatoria
            ? "A senha que você usou para entrar foi definida por outra pessoa. Escolha uma senha só sua para continuar — a partir de agora, ninguém além de você vai saber qual é."
            : "Escolha uma nova senha de acesso ao painel."}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label>{obrigatoria ? "Senha que você recebeu" : "Senha atual"}</Label>
              <InputSenha
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nova senha</Label>
              <InputSenha
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={8}
                required
              />
              <p className="text-xs text-slate-500">Pelo menos 8 caracteres.</p>
            </div>

            <div className="space-y-2">
              <Label>Repita a nova senha</Label>
              <InputSenha
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <Button type="submit" disabled={salvando} className="w-full">
              {salvando ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
