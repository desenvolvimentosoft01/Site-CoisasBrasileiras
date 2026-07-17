"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCarrinho, totalCarrinho } from "@/lib/carrinho-store"
import { mascaraCEP } from "@/lib/mascaras"
import { Loader2, Tag, X } from "lucide-react"

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function CheckoutPage() {
  const router = useRouter()
  const { itens, limpar } = useCarrinho()
  const [logado, setLogado] = useState<boolean | null>(null)

  const [cep, setCep] = useState("")
  const [logradouro, setLogradouro] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erro, setErro] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [valorFrete, setValorFrete] = useState(0)
  const [freteGratisAcimaDe, setFreteGratisAcimaDe] = useState(0)
  const [codigoCupom, setCodigoCupom] = useState("")
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; desconto: number } | null>(null)
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [erroCupom, setErroCupom] = useState("")

  useEffect(() => {
    fetch("/api/cliente/me").then((r) => setLogado(r.ok))
  }, [])

  const subtotal = totalCarrinho(itens)

  useEffect(() => {
    fetch(`/api/frete?subtotal=${subtotal}`)
      .then((r) => r.json())
      .then((dados) => {
        setValorFrete(dados.valorFrete)
        setFreteGratisAcimaDe(dados.freteGratisAcimaDe)
      })
  }, [subtotal])

  async function handleCepChange(valor: string) {
    const formatado = mascaraCEP(valor)
    setCep(formatado)

    const digitos = formatado.replace(/\D/g, "")
    if (digitos.length !== 8) return

    setBuscandoCep(true)
    try {
      const resposta = await fetch(`https://brasilapi.com.br/api/cep/v1/${digitos}`)
      if (resposta.ok) {
        const dados = await resposta.json()
        setLogradouro(dados.street || "")
        setBairro(dados.neighborhood || "")
        setCidade(dados.city || "")
        setEstado(dados.state || "")
      }
    } catch {
      // Se a busca falhar, o usuario preenche o endereco manualmente -
      // nao bloqueia o checkout por causa disso.
    } finally {
      setBuscandoCep(false)
    }
  }

  const desconto = cupomAplicado?.desconto ?? 0
  const total = subtotal + valorFrete - desconto

  async function aplicarCupom() {
    if (!codigoCupom.trim()) return
    setErroCupom("")
    setValidandoCupom(true)

    const resposta = await fetch("/api/cupom/validar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: codigoCupom, subtotal }),
    })

    setValidandoCupom(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErroCupom(dados.erro || "Cupom invalido")
      return
    }

    const { desconto } = await resposta.json()
    setCupomAplicado({ codigo: codigoCupom.trim().toUpperCase(), desconto })
  }

  function removerCupom() {
    setCupomAplicado(null)
    setCodigoCupom("")
    setErroCupom("")
  }

  async function finalizarPedido(evento: React.FormEvent) {
    evento.preventDefault()
    setErro("")
    setEnviando(true)

    const resposta = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endereco: { cep, logradouro, numero, complemento, bairro, cidade, estado },
        itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        cupomCodigo: cupomAplicado?.codigo,
      }),
    })

    setEnviando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Nao foi possivel finalizar o pedido")
      return
    }

    const { checkoutUrl } = await resposta.json()
    limpar()
    window.location.href = checkoutUrl
  }

  if (logado === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-heading mb-3 text-2xl font-semibold text-emerald-950">
          Entre na sua conta
        </h1>
        <p className="mb-6 text-neutral-500">
          Voce precisa estar logado para finalizar a compra.
        </p>
        <Button nativeButton={false} render={<Link href="/entrar?voltar=/checkout" />}>Entrar</Button>
      </div>
    )
  }

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-heading mb-3 text-2xl font-semibold text-emerald-950">
          Seu carrinho esta vazio
        </h1>
        <Button nativeButton={false} render={<Link href="/produtos" />}>Ver produtos</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="font-heading mb-8 text-3xl font-semibold text-emerald-950">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={finalizarPedido} className="space-y-4">
              <h2 className="font-medium text-neutral-800">Endereco de entrega</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      inputMode="numeric"
                      maxLength={9}
                      required
                    />
                    {buscandoCep && (
                      <Loader2
                        size={16}
                        className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-neutral-400"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Numero</Label>
                  <Input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logradouro</Label>
                <Input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={bairro} onChange={(e) => setBairro(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={cidade} onChange={(e) => setCidade(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Estado (UF)</Label>
                  <Input value={estado} maxLength={2} onChange={(e) => setEstado(e.target.value.toUpperCase())} required />
                </div>
              </div>

              {erro && <p className="text-sm text-red-500">{erro}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={enviando || logado === null}>
                {enviando ? "Finalizando..." : "Confirmar pedido"}
              </Button>
              <p className="text-xs text-neutral-400">
                Voce sera redirecionado para o Mercado Pago para concluir o pagamento.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-4 pt-6">
            <h2 className="font-medium text-neutral-800">Resumo do pedido</h2>
            {itens.map((item) => (
              <div key={item.produtoId} className="flex justify-between text-sm">
                <span className="text-neutral-600">
                  {item.quantidade}x {item.nome}
                </span>
                <span className="font-medium">{formatarPreco(item.preco * item.quantidade)}</span>
              </div>
            ))}
            <div className="space-y-1 border-t border-black/5 pt-3">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Subtotal</span>
                <span>{formatarPreco(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Frete</span>
                <span>{valorFrete === 0 ? "Gratis" : formatarPreco(valorFrete)}</span>
              </div>
              {freteGratisAcimaDe > 0 && valorFrete > 0 && (
                <p className="text-xs text-emerald-600">
                  Frete gratis em compras acima de {formatarPreco(freteGratisAcimaDe)}
                </p>
              )}
              {cupomAplicado && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto ({cupomAplicado.codigo})</span>
                  <span>-{formatarPreco(cupomAplicado.desconto)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-black/5 pt-3">
              {cupomAplicado ? (
                <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-emerald-700">
                    <Tag size={14} />
                    {cupomAplicado.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={removerCupom}
                    className="text-neutral-400 hover:text-red-500"
                    aria-label="Remover cupom"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={codigoCupom}
                    onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                    placeholder="Cupom de desconto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={aplicarCupom}
                    disabled={validandoCupom || !codigoCupom.trim()}
                  >
                    {validandoCupom ? "..." : "Aplicar"}
                  </Button>
                </div>
              )}
              {erroCupom && <p className="mt-1 text-xs text-red-500">{erroCupom}</p>}
            </div>

            <div className="flex justify-between border-t border-black/5 pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="text-emerald-700">{formatarPreco(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
