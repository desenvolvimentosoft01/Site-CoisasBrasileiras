"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CORES_TEMA, styleCoresTema } from "@/lib/cores"
import { useCoresTema } from "@/lib/contexto-cores"
import { RotateCcw } from "lucide-react"

// Usado so como posicao inicial do seletor de cor quando o campo ainda esta
// vazio (sem override salvo) - a cor de verdade aplicada nesse caso continua
// vindo do padrao definido em app/globals.css, isso aqui e so pro <input
// type="color"> nao reclamar de valor vazio.
const PADRAO_VISUAL: Record<string, string> = {
  cor_primaria: "#047857",
  cor_primaria_texto: "#fafafa",
  cor_secundaria: "#ecfdf5",
  cor_secundaria_texto: "#065f46",
  cor_destaque: "#d1fae5",
  cor_destaque_texto: "#065f46",
  cor_neutra: "#f3f6f4",
  cor_neutra_texto: "#6b7280",
  cor_perigo: "#dc2626",
  cor_fundo: "#ffffff",
  cor_texto: "#171717",
  cor_borda: "#e2e8e5",
}

export function CoresConteudo({ coresIniciais }: { coresIniciais: Record<string, string> }) {
  // Estado vive no contexto (compartilhado com o AdminShell) pra que mudar
  // um seletor aqui reflita na hora na sidebar/botoes do resto da tela, sem
  // precisar salvar nem dar F5. So sincroniza com o que veio do servidor na
  // primeira renderizacao.
  const { cores, setCores } = useCoresTema()
  useEffect(() => {
    setCores(coresIniciais)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- so na montagem, pra nao sobrescrever edicoes em andamento
  }, [])

  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  function alterar(chave: string, valor: string) {
    setCores({ ...cores, [chave]: valor })
  }

  function restaurar(chave: string) {
    setCores({ ...cores, [chave]: "" })
  }

  async function salvar() {
    setSalvando(true)
    setSalvo(false)

    await fetch("/api/admin/cores", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cores),
    })

    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cores do sistema</h1>
          <p className="text-sm text-slate-500">
            Controla a paleta completa do site e do painel administrativo. Visível só para você.
            Cor em branco = usa o padrão do sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar cores"}
          </Button>
          {salvo && <span className="text-sm text-emerald-500">Salvo!</span>}
        </div>
      </div>

      <div
        className="rounded-xl border border-border bg-background p-6 text-foreground"
        style={styleCoresTema(cores)}
      >
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Pré-visualização</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Botão primário
          </span>
          <span className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
            Botão secundário
          </span>
          <span className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            Destaque
          </span>
          <span className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white">
            Excluir
          </span>
          <span className="rounded-md border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
            Texto neutro
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">Paleta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {CORES_TEMA.map(({ chave, label }) => (
            <div key={chave} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{label}</Label>
                {cores[chave] && (
                  <button
                    type="button"
                    onClick={() => restaurar(chave)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                    title="Restaurar cor padrão"
                  >
                    <RotateCcw size={11} />
                    padrão
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={cores[chave] || PADRAO_VISUAL[chave] || "#000000"}
                  onChange={(e) => alterar(chave, e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-slate-300 bg-transparent"
                />
                <Input
                  value={cores[chave] || ""}
                  onChange={(e) => alterar(chave, e.target.value)}
                  placeholder="Padrão do sistema"
                  className="w-32 font-mono"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar cores"}
        </Button>
        {salvo && <span className="text-sm text-emerald-500">Salvo!</span>}
      </div>
    </div>
  )
}
