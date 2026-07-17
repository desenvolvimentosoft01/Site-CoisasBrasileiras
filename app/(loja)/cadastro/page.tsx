"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mascaraTelefone } from "@/lib/mascaras"

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    setErro("")
    setCarregando(true)

    const resposta = await fetch("/api/cliente/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, telefone: telefone.replace(/\D/g, ""), senha }),
    })

    setCarregando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Nao foi possivel criar a conta")
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
              <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            {erro && <p className="text-sm text-red-500">{erro}</p>}
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-500">
            Ja tem conta?{" "}
            <Link href="/entrar" className="font-medium text-emerald-700 hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
