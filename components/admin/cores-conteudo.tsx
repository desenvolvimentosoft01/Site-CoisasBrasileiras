"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CORES_TEMA, styleCoresTema } from "@/lib/cores"
import { useCoresTema } from "@/lib/contexto-cores"
import { registrarAuditoria } from "@/lib/auditoria"
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

// Paleta de um dos dois sites, editada independente da outra - so a
// "colorido" (Coisas Brasileiras) tambem pinta o proprio painel admin em
// tempo real (via contexto compartilhado com o AdminShell); a "branco"
// (Porcelanas Brancas) fica isolada nessa tela, sem repintar o admin
// enquanto voce edita.
function PainelCores({
  marca,
  cores,
  onAlterar,
  onSalvar,
  salvando,
  salvo,
}: {
  marca: "colorido" | "branco"
  cores: Record<string, string>
  onAlterar: (chave: string, valor: string) => void
  onSalvar: () => void
  salvando: boolean
  salvo: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button onClick={onSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar cores"}
        </Button>
        {salvo && <span className="text-sm text-emerald-500">Salvo!</span>}
      </div>

      <div
        className="rounded-xl border border-border bg-background p-6 text-foreground"
        style={styleCoresTema(cores)}
      >
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
          Pré-visualização — {marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras"}
        </p>
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
                    onClick={() => onAlterar(chave, "")}
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
                  onChange={(e) => onAlterar(chave, e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-slate-300 bg-transparent"
                />
                <Input
                  value={cores[chave] || ""}
                  onChange={(e) => onAlterar(chave, e.target.value)}
                  placeholder="Padrão do sistema"
                  className="w-32 font-mono"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function CoresConteudo({
  coresColoridoIniciais,
  coresBrancoIniciais,
}: {
  coresColoridoIniciais: Record<string, string>
  coresBrancoIniciais: Record<string, string>
}) {
  const [aba, setAba] = useState<"colorido" | "branco">("colorido")

  // "Colorido" vive no contexto compartilhado com o AdminShell (repinta a
  // sidebar/botoes em tempo real, comportamento de sempre). "Branco" e
  // estado local, isolado - editar o Porcelanas Brancas nao deve mudar a
  // cara do proprio painel admin enquanto voce mexe nele.
  const { cores: coresColorido, setCores: setCoresColorido } = useCoresTema()
  const [coresBranco, setCoresBranco] = useState(coresBrancoIniciais)

  useEffect(() => {
    setCoresColorido(coresColoridoIniciais)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- so na montagem, pra nao sobrescrever edicoes em andamento
  }, [])

  const coresAntesColoridoRef = useRef(coresColoridoIniciais)
  const coresAntesBrancoRef = useRef(coresBrancoIniciais)

  const [salvandoColorido, setSalvandoColorido] = useState(false)
  const [salvoColorido, setSalvoColorido] = useState(false)
  const [salvandoBranco, setSalvandoBranco] = useState(false)
  const [salvoBranco, setSalvoBranco] = useState(false)

  async function salvarColorido() {
    setSalvandoColorido(true)
    setSalvoColorido(false)

    await fetch("/api/admin/cores", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coresColorido),
    })

    registrarAuditoria({
      tela: "Cores do Sistema",
      acao: "edicao",
      tabela: "TAB_CONFIGURACAO",
      antes: coresAntesColoridoRef.current,
      depois: coresColorido,
    })
    coresAntesColoridoRef.current = coresColorido

    setSalvandoColorido(false)
    setSalvoColorido(true)
    setTimeout(() => setSalvoColorido(false), 2000)
  }

  async function salvarBranco() {
    setSalvandoBranco(true)
    setSalvoBranco(false)

    await fetch("/api/admin/cores?marca=branco", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coresBranco),
    })

    registrarAuditoria({
      tela: "Cores do Sistema",
      acao: "edicao",
      tabela: "TAB_CONFIGURACAO_MARCA",
      antes: coresAntesBrancoRef.current,
      depois: coresBranco,
    })
    coresAntesBrancoRef.current = coresBranco

    setSalvandoBranco(false)
    setSalvoBranco(true)
    setTimeout(() => setSalvoBranco(false), 2000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cores do sistema</h1>
          <p className="text-sm text-slate-500">
            Controla a paleta de cada site (e, na aba Colorido, também do painel administrativo).
            Visível só para você. Cor em branco = usa o padrão do sistema.
          </p>
        </div>
        <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
          <TabsList>
            <TabsTrigger value="colorido">🎨 Coisas Brasileiras</TabsTrigger>
            <TabsTrigger value="branco">⚪ Porcelanas Brancas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {aba === "colorido" ? (
        <PainelCores
          marca="colorido"
          cores={coresColorido}
          onAlterar={(chave, valor) => setCoresColorido({ ...coresColorido, [chave]: valor })}
          onSalvar={salvarColorido}
          salvando={salvandoColorido}
          salvo={salvoColorido}
        />
      ) : (
        <PainelCores
          marca="branco"
          cores={coresBranco}
          onAlterar={(chave, valor) => setCoresBranco({ ...coresBranco, [chave]: valor })}
          onSalvar={salvarBranco}
          salvando={salvandoBranco}
          salvo={salvoBranco}
        />
      )}
    </div>
  )
}
