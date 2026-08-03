"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputSenha } from "@/components/ui/input-senha"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function EntrarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    setErro("")
    setCarregando(true)

    const resposta = await fetch("/api/cliente/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    })

    setCarregando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Nao foi possivel entrar")
      return
    }

    router.push(searchParams.get("voltar") || "/")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">Entrar</CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Acesse sua conta para acompanhar seus pedidos
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <InputSenha id="senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          {erro && <p className="text-sm text-red-500">{erro}</p>}
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Ainda nao tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-emerald-700 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function EntrarClientePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <Suspense fallback={null}>
        <EntrarForm />
      </Suspense>
    </div>
  )
}
