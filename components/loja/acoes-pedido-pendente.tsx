"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PagamentoPedido } from "@/components/loja/pagamento-pedido"

// Acoes disponiveis pro cliente enquanto o pedido ainda nao foi pago:
// retomar o pagamento (Payment Brick de novo, pro caso de ter fechado a
// aba/dado erro no meio) ou cancelar de vez. Depois de "processando_pagamento"
// so cancelamento fica disponivel - reabrir o Brick nesse ponto poderia gerar
// uma segunda cobranca em cima de um pagamento que ja esta em analise no MP.
export function AcoesPedidoPendente({
  pedidoId,
  status,
  total,
  emailCliente,
}: {
  pedidoId: string
  status: "aguardando_pagamento" | "processando_pagamento"
  total: number
  emailCliente: string
}) {
  const router = useRouter()
  const [retomando, setRetomando] = useState(false)
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erro, setErro] = useState("")

  async function cancelarPedido() {
    setCancelando(true)
    setErro("")

    const resposta = await fetch(`/api/cliente/pedidos/${pedidoId}/cancelar`, { method: "POST" })
    const dados = await resposta.json()
    setCancelando(false)
    setModalCancelarAberto(false)

    if (!resposta.ok) {
      setErro(dados.erro || "Não foi possível cancelar o pedido")
      return
    }

    router.refresh()
  }

  if (retomando) {
    return (
      <Card className="mb-8 text-left">
        <CardContent className="pt-6">
          <PagamentoPedido pedidoId={pedidoId} total={total} emailCliente={emailCliente} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mb-8 space-y-2">
      {erro && <p className="text-sm text-red-500">{erro}</p>}

      {status === "aguardando_pagamento" && (
        <Button className="w-full" size="lg" onClick={() => setRetomando(true)}>
          Concluir pagamento
        </Button>
      )}

      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={() => setModalCancelarAberto(true)}
      >
        Cancelar pedido
      </Button>

      <AlertDialog open={modalCancelarAberto} onOpenChange={setModalCancelarAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Se você já pagou, aguarde a confirmação antes de cancelar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction disabled={cancelando} onClick={cancelarPedido}>
              {cancelando ? "Cancelando..." : "Cancelar pedido"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
