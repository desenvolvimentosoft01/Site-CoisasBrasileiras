"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CATALOGO_RECURSOS, ROTULO_PLANO, RECURSOS_POR_PLANO, type Recursos } from "@/lib/recursos"

// Tela do desenvolvedor: define o plano contratado da instalacao e quais
// modulos/integracoes ficam visiveis. Fica fora do alcance do cliente de
// proposito - plano e o que ele contratou, nao o que ele escolhe na tela.
const PLANOS_CONTRATAVEIS = ["basico", "intermediario", "avancado"] as const

export function PlanoConteudo({
  planoInicial,
  recursosIniciais,
}: {
  planoInicial: string
  recursosIniciais: Recursos
}) {
  const router = useRouter()
  const [plano, setPlano] = useState(planoInicial)
  const [recursos, setRecursos] = useState<Recursos>(recursosIniciais)
  const [salvando, setSalvando] = useState(false)

  async function salvar(corpo: { plano?: string; recursos?: Partial<Recursos> }) {
    setSalvando(true)
    const resposta = await fetch("/api/admin/recursos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    })
    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null)
      toast.error(dados?.erro ?? "Não foi possível salvar")
      return
    }

    const dados = await resposta.json()
    setRecursos(dados.recursos)
    // O menu e as telas leem os recursos no servidor - sem o refresh, o item
    // que acabou de ser ligado só apareceria no próximo F5.
    router.refresh()
    toast.success("Plano atualizado.")
  }

  function alternarRecurso(chave: keyof Recursos) {
    const novo = { ...recursos, [chave]: !recursos[chave] }
    setRecursos(novo)
    salvar({ recursos: { [chave]: novo[chave] } })
  }

  async function trocarPlano(novoPlano: string) {
    setPlano(novoPlano)
    await salvar({ plano: novoPlano })
  }

  const grupos = ["Módulos", "Integrações"] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Plano e recursos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define o que esta instalação enxerga. Módulo desligado some do menu e a tela fica
          inacessível; integração desligada some das Configurações e dos filtros. Visível só para o
          desenvolvedor.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm font-medium">Plano contratado</p>
            <p className="text-xs text-slate-500">
              Trocar o plano religa todos os recursos conforme o pacote escolhido. Depois disso, dá
              para ajustar recurso por recurso abaixo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PLANOS_CONTRATAVEIS.map((opcao) => (
              <Button
                key={opcao}
                variant={plano === opcao ? "default" : "outline"}
                size="sm"
                disabled={salvando}
                onClick={() => trocarPlano(opcao)}
              >
                {ROTULO_PLANO[opcao]}
                <span className="ml-1.5 text-[11px] opacity-70">
                  ({RECURSOS_POR_PLANO[opcao].length} recursos)
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {grupos.map((grupo) => (
        <Card key={grupo}>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">{grupo}</p>
            <div className="divide-y divide-slate-100">
              {CATALOGO_RECURSOS.filter((recurso) => recurso.grupo === grupo).map((recurso) => (
                <label
                  key={recurso.chave}
                  className="flex cursor-pointer items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <input
                    type="checkbox"
                    checked={recursos[recurso.chave]}
                    onChange={() => alternarRecurso(recurso.chave)}
                    disabled={salvando}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>
                    <span className="block text-sm font-medium">{recurso.nome}</span>
                    <span className="block text-xs text-slate-500">{recurso.descricao}</span>
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
