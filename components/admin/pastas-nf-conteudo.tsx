"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CampoDica } from "@/components/ui/campo-dica"
import { FolderOpen, FolderX, MonitorSmartphone, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import {
  escolherPasta,
  esquecerPasta,
  garantirPermissaoDeEscrita,
  guardarPasta,
  lerPasta,
  navegadorSuportaPastaPadrao,
  type TipoPasta,
} from "@/lib/pastas-padrao"

// Parametrizacao das pastas de arquivo das notas fiscais. Sao DOIS parametros
// independentes de proposito - o arquivamento do dia a dia e o lote que vai
// pro contador raramente moram no mesmo lugar:
//   - "salvar"   -> copia automatica no momento em que a nota entra no sistema
//   - "exportar" -> destino padrao do lote gerado em Compras
type ParametroPasta = {
  tipo: TipoPasta
  titulo: string
  descricao: string
  ajuda: string
}

const PARAMETROS: ParametroPasta[] = [
  {
    tipo: "salvar",
    titulo: "Pasta para salvar automaticamente",
    descricao:
      "Sempre que uma nota for importada por XML, uma cópia do arquivo é gravada nesta pasta, sem precisar fazer nada.",
    ajuda:
      "É o arquivamento do dia a dia. Serve para manter uma cópia dos XMLs organizada no computador, além da cópia que o sistema já guarda no banco de dados. Como o XML tem guarda obrigatória de 5 anos, ter os arquivos também numa pasta sua (que entra no seu backup) é uma segurança a mais.",
  },
  {
    tipo: "exportar",
    titulo: "Pasta padrão da exportação",
    descricao:
      "Destino sugerido quando você exporta o lote de notas em Compras para enviar ao contador.",
    ajuda:
      "Com essa pasta configurada, o botão de exportar em Compras grava direto aqui, sem abrir o seletor toda vez. É o lote do fechamento mensal — normalmente uma pasta por mês ou uma pasta que sincroniza com Drive/OneDrive.",
  },
]

export function PastasNfConteudo() {
  const [suportado, setSuportado] = useState(true)
  const [nomes, setNomes] = useState<Record<TipoPasta, string | null>>({
    salvar: null,
    exportar: null,
  })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Tudo depois do await de proposito: o estado das pastas so existe no
    // navegador (IndexedDB), entao nao da pra resolver no primeiro render -
    // e mexer no estado antes do await geraria render em cascata.
    async function carregarPastasConfiguradas() {
      // lerPasta ja devolve null em navegador sem suporte, entao nao precisa
      // checar antes - e o await garante que nenhum setState roda sincrono.
      const [salvar, exportar] = await Promise.all([lerPasta("salvar"), lerPasta("exportar")])

      setSuportado(navegadorSuportaPastaPadrao())
      setNomes({ salvar: salvar?.name ?? null, exportar: exportar?.name ?? null })
      setCarregando(false)
    }

    carregarPastasConfiguradas()
  }, [])

  async function configurar(tipo: TipoPasta) {
    const pasta = await escolherPasta()
    if (!pasta) return

    // Pede a permissao de escrita ja na configuracao: melhor descobrir agora
    // que a pasta nao pode ser gravada do que na hora de exportar o mes.
    if (!(await garantirPermissaoDeEscrita(pasta))) {
      toast.error("O navegador não liberou permissão de escrita nessa pasta")
      return
    }

    await guardarPasta(tipo, pasta)
    setNomes((atual) => ({ ...atual, [tipo]: pasta.name }))
    toast.success(`Pasta "${pasta.name}" configurada`)
  }

  async function remover(tipo: TipoPasta) {
    await esquecerPasta(tipo)
    setNomes((atual) => ({ ...atual, [tipo]: null }))
    toast.success("Pasta removida")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Pastas das notas fiscais</h1>
        <p className="text-sm text-slate-500">
          Onde o sistema salva e exporta os arquivos XML e DANFE das notas.
        </p>
      </div>

      {!suportado && (
        <Card>
          <CardContent className="flex gap-3 pt-6">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="text-sm">
              <p className="font-medium">Este navegador não permite configurar pastas</p>
              <p className="text-slate-500">
                A escolha de pasta só funciona no Google Chrome e no Microsoft Edge. Em outros
                navegadores, a exportação continua funcionando normalmente pelo download do arquivo
                .zip.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {PARAMETROS.map((parametro) => (
        <Card key={parametro.tipo}>
          <CardContent className="space-y-3 pt-6">
            <div>
              <Label className="text-sm font-semibold">
                {parametro.titulo}
                <CampoDica>{parametro.ajuda}</CampoDica>
              </Label>
              <p className="mt-1 text-xs text-slate-500">{parametro.descricao}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                <FolderOpen size={16} className="shrink-0 text-slate-400" />
                <span className="truncate">
                  {carregando
                    ? "Carregando..."
                    : nomes[parametro.tipo]
                      ? nomes[parametro.tipo]
                      : "Nenhuma pasta configurada"}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!suportado || carregando}
                  onClick={() => configurar(parametro.tipo)}
                >
                  <FolderOpen size={16} className="mr-2" />
                  {nomes[parametro.tipo] ? "Trocar pasta" : "Escolher pasta"}
                </Button>
                {nomes[parametro.tipo] && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => remover(parametro.tipo)}
                    title="Parar de usar esta pasta"
                  >
                    <FolderX size={16} />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="flex gap-3 pt-6">
          <MonitorSmartphone size={18} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="text-sm text-slate-500">
            <p className="font-medium text-slate-700">Esta configuração é deste computador</p>
            <p>
              Por segurança, o navegador não deixa um site guardar o caminho de uma pasta — ele
              guarda apenas a permissão que você concedeu, e essa permissão vale só neste navegador.
              Ao usar o sistema em outro computador, escolha as pastas novamente. Por isso o sistema
              também mantém uma cópia de cada XML no banco de dados: essa não depende de máquina
              nenhuma.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
