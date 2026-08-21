"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"
import { toast } from "sonner"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { useConfirmar } from "@/components/admin/confirm-provider"
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
  const confirmar = useConfirmar()

  // Estado salvo x estado em edicao. Antes cada clique gravava sozinho, o que
  // era seguro mas fugia do padrao do resto do sistema (grade + Gravar) e nao
  // deixava desistir: desligar um modulo por engano ja tirava a tela do ar do
  // cliente antes de dar tempo de reconsiderar.
  const [planoSalvo, setPlanoSalvo] = useState(planoInicial)
  const [recursosSalvos, setRecursosSalvos] = useState<Recursos>(recursosIniciais)

  const [plano, setPlano] = useState(planoInicial)
  const [recursos, setRecursos] = useState<Recursos>(recursosIniciais)
  const [salvando, setSalvando] = useState(false)

  const alterados = CATALOGO_RECURSOS.filter(
    (recurso) => recursos[recurso.chave] !== recursosSalvos[recurso.chave]
  )
  const planoMudou = plano !== planoSalvo
  const temAlteracao = planoMudou || alterados.length > 0

  function alternarRecurso(chave: keyof Recursos) {
    setRecursos((atual) => ({ ...atual, [chave]: !atual[chave] }))
  }

  // Trocar de plano marca todos os recursos do pacote AQUI na tela, sem
  // gravar: assim da pra ver o que o plano liga e desliga antes de confirmar,
  // e ainda ajustar recurso por recurso em cima disso.
  function escolherPlano(novoPlano: (typeof PLANOS_CONTRATAVEIS)[number]) {
    setPlano(novoPlano)
    const doPlano = RECURSOS_POR_PLANO[novoPlano]
    setRecursos(
      Object.fromEntries(
        CATALOGO_RECURSOS.map((recurso) => [
          recurso.chave,
          doPlano.includes(recurso.chave),
        ])
      ) as Recursos
    )
  }

  async function gravar() {
    // Desligar recurso tira tela do ar pra quem esta usando o sistema agora -
    // a confirmacao diz exatamente quais, porque "5 recursos alterados" nao
    // ajuda ninguem a perceber que desmarcou o modulo errado.
    const desligados = alterados.filter((recurso) => !recursos[recurso.chave])
    if (desligados.length > 0) {
      const nomes = desligados.map((recurso) => recurso.nome).join(", ")
      const confirmado = await confirmar({
        descricao: `Desligar ${desligados.length === 1 ? "o recurso" : "os recursos"}: ${nomes}?`,
        consequencia:
          "Módulo desligado some do menu e a tela fica inacessível para todos os usuários, inclusive quem estiver com ela aberta agora. Integração desligada some das Configurações e dos filtros. Nada é apagado — religar aqui devolve tudo como estava.",
      })
      if (!confirmado) return
    }

    setSalvando(true)
    const resposta = await fetch("/api/admin/recursos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      // Plano e recursos vão na MESMA chamada: a rota aplica o pacote do plano
      // primeiro e os ajustes depois, que é a ordem que a tela está mostrando.
      body: JSON.stringify({
        plano: planoMudou ? plano : undefined,
        recursos: Object.fromEntries(
          alterados.map((recurso) => [recurso.chave, recursos[recurso.chave]])
        ),
      }),
    })
    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null)
      toast.error(dados?.erro ?? "Não foi possível salvar")
      return
    }

    const dados = await resposta.json()
    setRecursos(dados.recursos)
    setRecursosSalvos(dados.recursos)
    setPlanoSalvo(plano)

    // O menu e as telas leem os recursos no servidor - sem o refresh, o item
    // que acabou de ser ligado só apareceria no próximo F5.
    router.refresh()
    toast.success("Plano e recursos salvos.")
  }

  function cancelar() {
    setPlano(planoSalvo)
    setRecursos(recursosSalvos)
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

      <div className="overflow-hidden rounded-lg border border-border">
        <BarraFerramentas
          botoes={[
            {
              label: "Gravar",
              icon: Save,
              onClick: gravar,
              variante: "success",
              disabled: salvando || !temAlteracao,
            },
            {
              label: "Cancelar",
              icon: X,
              onClick: cancelar,
              variante: "danger",
              disabled: salvando || !temAlteracao,
            },
          ]}
        />
      </div>

      {temAlteracao && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {planoMudou && (
            <>
              Plano alterado para <strong>{ROTULO_PLANO[plano as keyof typeof ROTULO_PLANO]}</strong>
              {alterados.length > 0 ? " e " : ". "}
            </>
          )}
          {alterados.length > 0 && (
            <>
              {alterados.length} {alterados.length === 1 ? "recurso alterado" : "recursos alterados"}.{" "}
            </>
          )}
          Nada foi salvo ainda — clique em <strong>Gravar</strong> para aplicar.
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm font-medium">Plano contratado</p>
            <p className="text-xs text-slate-500">
              Escolher um plano marca abaixo os recursos do pacote, para você conferir antes de
              gravar. Depois disso, dá para ajustar recurso por recurso.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PLANOS_CONTRATAVEIS.map((opcao) => (
              <Button
                key={opcao}
                variant={plano === opcao ? "default" : "outline"}
                size="sm"
                disabled={salvando}
                onClick={() => escolherPlano(opcao)}
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
              {CATALOGO_RECURSOS.filter((recurso) => recurso.grupo === grupo).map((recurso) => {
                const mudou = recursos[recurso.chave] !== recursosSalvos[recurso.chave]
                return (
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
                      <span className="block text-sm font-medium">
                        {recurso.nome}
                        {mudou && (
                          <span className="ml-2 text-[11px] font-normal text-amber-600">
                            {recursos[recurso.chave] ? "será ligado" : "será desligado"}
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-slate-500">{recurso.descricao}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
