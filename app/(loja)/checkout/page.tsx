"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCarrinho, totalCarrinho } from "@/lib/carrinho-store"
import { mascaraCEP } from "@/lib/mascaras"
import { AplicarCupom } from "@/components/loja/aplicar-cupom"
import { Loader2 } from "lucide-react"

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

type OpcaoFrete = { transportadora: string; servico: string; valor: number; prazoDias: number | null }

export default function CheckoutPage() {
  const { itens, limpar, cupom } = useCarrinho()
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
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [freteEscolhidoIndice, setFreteEscolhidoIndice] = useState(0)
  const [freteGratisAcimaDe, setFreteGratisAcimaDe] = useState(0)
  const [carregandoFrete, setCarregandoFrete] = useState(false)

  const opcaoFrete = opcoesFrete[freteEscolhidoIndice]
  const valorFrete = opcaoFrete?.valor ?? 0

  useEffect(() => {
    fetch("/api/cliente/me").then((r) => setLogado(r.ok))
  }, [])

  const subtotal = totalCarrinho(itens)

  useEffect(() => {
    if (itens.length === 0) return
    // So calcula com o estado ja preenchido (apos a busca do CEP) - antes
    // disso o back-end nao tem regiao pra achar a faixa de frete.
    if (!estado) return

    // eslint-disable-next-line react-hooks/set-state-in-effect -- liga o indicador de loading antes do fetch de frete
    setCarregandoFrete(true)
    fetch("/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        estado,
        cep,
      }),
    })
      .then((r) => r.json())
      .then((dados) => {
        setOpcoesFrete(dados.opcoes || [])
        setFreteEscolhidoIndice(0) // sempre comeca com a mais barata pre-selecionada
        setFreteGratisAcimaDe(dados.freteGratisAcimaDe)
      })
      .finally(() => setCarregandoFrete(false))
  }, [itens, estado, cep, subtotal])

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

  const desconto = cupom?.desconto ?? 0
  const total = subtotal + valorFrete - desconto

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
        cupomCodigo: cupom?.codigo,
        freteEscolhido: opcaoFrete
          ? { transportadora: opcaoFrete.transportadora, servico: opcaoFrete.servico }
          : undefined,
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
                Voce sera redirecionado para o Mercado Pago para concluir o pagamento (Pix, cartao ou boleto,
                conforme disponibilidade).
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

              {estado && (
                <div className="space-y-2 py-1">
                  <span className="text-sm text-neutral-600">Frete</span>
                  {carregandoFrete ? (
                    <p className="text-xs text-neutral-400">Calculando opcoes de frete...</p>
                  ) : opcoesFrete.length === 0 ? (
                    <p className="text-xs text-neutral-400">Nenhuma opcao de frete encontrada.</p>
                  ) : (
                    opcoesFrete.map((opcao, indice) => (
                      <label
                        key={`${opcao.transportadora}-${opcao.servico}`}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border p-2 text-sm ${
                          freteEscolhidoIndice === indice
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-black/10"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="opcaoFrete"
                            checked={freteEscolhidoIndice === indice}
                            onChange={() => setFreteEscolhidoIndice(indice)}
                          />
                          <span>
                            {opcao.transportadora} - {opcao.servico}
                            {opcao.prazoDias != null && (
                              <span className="block text-xs text-neutral-500">
                                Prazo: {opcao.prazoDias} dia(s) util(is)
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="font-medium">
                          {opcao.valor === 0 ? "Gratis" : formatarPreco(opcao.valor)}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
              {freteGratisAcimaDe > 0 && valorFrete > 0 && (
                <p className="text-xs text-emerald-600">
                  Frete gratis em compras acima de {formatarPreco(freteGratisAcimaDe)}
                </p>
              )}
              {cupom && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Desconto ({cupom.codigo})</span>
                  <span>-{formatarPreco(cupom.desconto)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-black/5 pt-3">
              <AplicarCupom subtotal={subtotal} />
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
