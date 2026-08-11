"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"

export default function AdminErro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">Algo deu errado ao carregar esta página</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Pode ter sido uma falha temporária de conexão. Tente novamente — se o problema continuar, atualize a página.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </button>
    </div>
  )
}
