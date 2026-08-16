"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { initMercadoPago, Payment } from "@mercadopago/sdk-react"
import type { IPaymentFormData } from "@mercadopago/sdk-react/esm/bricks/payment/type"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

let mpInicializado = false

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// Payment Brick reutilizado tanto pelo checkout (pedido recem criado) quanto
// pela tela de confirmacao do pedido (retomar pagamento de um pedido que
// ficou parado em "aguardando_pagamento", ex: apos fechar a aba no meio do
// pagamento anterior).
export function PagamentoPedido({
  pedidoId,
  total,
  emailCliente,
}: {
  pedidoId: string
  total: number
  emailCliente: string
}) {
  const router = useRouter()
  const [chavePublicaMP, setChavePublicaMP] = useState<string | null>(null)
  const [erroPagamento, setErroPagamento] = useState("")
  const [pixDados, setPixDados] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null)

  useEffect(() => {
    fetch("/api/checkout/chave-publica")
      .then((r) => r.json())
      .then((dados) => {
        if (dados.publicKey && !mpInicializado) {
          initMercadoPago(dados.publicKey, { locale: "pt-BR" })
          mpInicializado = true
        }
        setChavePublicaMP(dados.publicKey)
      })
  }, [])

  async function processarPagamento({ formData }: IPaymentFormData) {
    setErroPagamento("")

    const resposta = await fetch("/api/checkout/pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId, formData }),
    })

    const dados = await resposta.json()

    if (!resposta.ok) {
      setErroPagamento(dados.erro || "Não foi possível processar o pagamento")
      return
    }

    if (dados.pix) {
      setPixDados(dados.pix)
      return
    }

    // Aprovado, recusado ou em analise - o status final so chega pelo
    // webhook, mas a pagina do pedido ja reflete "processando"/"aguardando"
    // corretamente enquanto isso.
    router.push(`/pedido/${pedidoId}`)
    router.refresh()
  }

  if (pixDados) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="font-medium text-neutral-800">Pague com Pix</h2>
        <p className="text-sm text-neutral-500">
          Escaneie o QR code no app do seu banco ou copie o código abaixo.
        </p>
        {pixDados.qrCodeBase64 && (
          // eslint-disable-next-line @next/next/no-img-element -- QR code vem como base64 direto da API do MP, nao vale a pena passar pelo otimizador do Next
          <img
            src={`data:image/png;base64,${pixDados.qrCodeBase64}`}
            alt="QR code Pix"
            className="mx-auto h-56 w-56"
          />
        )}
        <Input readOnly value={pixDados.qrCode} onClick={(e) => e.currentTarget.select()} />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigator.clipboard.writeText(pixDados.qrCode)}
        >
          Copiar código Pix
        </Button>
        <Button nativeButton={false} className="w-full" render={<Link href={`/pedido/${pedidoId}`} />}>
          Já paguei, ver meu pedido
        </Button>
      </div>
    )
  }

  if (!chavePublicaMP) {
    return <p className="text-sm text-neutral-500">Carregando formas de pagamento...</p>
  }

  return (
    <>
      <p className="mb-4 text-sm text-neutral-500">Total: {formatarPreco(total)}</p>
      {erroPagamento && <p className="mb-4 text-sm text-red-500">{erroPagamento}</p>}
      <Payment
        initialization={{ amount: total, payer: { email: emailCliente } }}
        customization={{
          paymentMethods: { creditCard: "all", debitCard: "all", bankTransfer: "all", ticket: "all" },
        }}
        onSubmit={processarPagamento}
        onError={(erro) => {
          console.error("[Payment Brick]", erro)
          setErroPagamento("Não foi possível carregar o formulário de pagamento.")
        }}
      />
    </>
  )
}
