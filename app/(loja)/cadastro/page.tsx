"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputSenha } from "@/components/ui/input-senha"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mascaraTelefone } from "@/lib/mascaras"

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [senha, setSenha] = useState("")
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    setErro("")

    if (!aceitouTermos) {
      setErro("É preciso aceitar a Política de Privacidade e os Termos de Uso")
      return
    }

    setCarregando(true)

    const resposta = await fetch("/api/cliente/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, telefone: telefone.replace(/\D/g, ""), senha, aceitouTermos }),
    })

    setCarregando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Não foi possível criar a conta")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">Criar conta</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Cadastre-se para finalizar suas compras
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <InputSenha id="senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            <label htmlFor="aceitou-termos" className="flex items-start gap-2 text-sm text-neutral-600">
              <input
                id="aceitou-termos"
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300"
              />
              <span>
                Li e aceito a{" "}
                <Link href="/politica-de-privacidade" target="_blank" className="font-medium text-emerald-700 hover:underline">
                  Política de Privacidade
                </Link>{" "}
                e os{" "}
                <Link href="/termos-de-uso" target="_blank" className="font-medium text-emerald-700 hover:underline">
                  Termos de Uso
                </Link>
              </span>
            </label>
            {erro && <p className="text-sm text-red-500">{erro}</p>}
            <Button type="submit" className="w-full" disabled={carregando || !aceitouTermos}>
              {carregando ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-500">
            Já tem conta?{" "}
            <Link href="/entrar" className="font-medium text-emerald-700 hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
