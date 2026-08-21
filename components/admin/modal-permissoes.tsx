"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { TELAS_ADMIN, type Permissoes } from "@/lib/telas-admin"

// Permissões de tela de um operador (migration 063).
//
// Cada tela mostra o padrão do papel e permite marcar a exceção. Não é uma
// lista de "tudo desmarcado" de propósito: quem abre isso quer liberar UMA
// tela pra alguém, e não recadastrar o acesso inteiro do zero.
export function ModalPermissoes({
  usuario,
  onFechar,
}: {
  usuario: { id: string; nome: string; papel: string } | null
  onFechar: () => void
}) {
  const [permissoes, setPermissoes] = useState<Permissoes | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!usuario) return
    let cancelado = false

    fetch(`/api/admin/usuarios/${usuario.id}/permissoes`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((dados) => !cancelado && setPermissoes(dados))
      .catch(() => !cancelado && setPermissoes({}))

    return () => {
      cancelado = true
    }
  }, [usuario])

  if (!usuario) return null

  // Admin enxerga tudo por definição - editar permissão dele criaria a ilusão
  // de um bloqueio que o sistema ignora na hora de abrir a tela.
  const ehAdmin = usuario.papel === "admin"

  async function salvar() {
    if (!usuario || !permissoes) return
    setSalvando(true)

    const resposta = await fetch(`/api/admin/usuarios/${usuario.id}/permissoes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(permissoes),
    })
    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null)
      toast.error(dados?.erro ?? "Não foi possível salvar as permissões")
      return
    }

    toast.success("Permissões atualizadas. Valem no próximo carregamento de tela dessa pessoa.")
    onFechar()
  }

  const grupos = Array.from(new Set(TELAS_ADMIN.map((tela) => tela.grupo)))

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissões de {usuario.nome}</DialogTitle>
        </DialogHeader>

        {ehAdmin ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            Este usuário é <strong>administrador</strong> e enxerga todas as telas. Para restringir o
            acesso, mude o papel dele para <strong>operador</strong> e volte aqui.
          </p>
        ) : permissoes === null ? (
          <p className="py-6 text-sm text-slate-500">Carregando...</p>
        ) : (
          <div className="max-h-[55vh] space-y-4 overflow-auto pr-1">
            <p className="text-xs text-slate-500">
              Marcado = pode abrir. O que não for alterado segue o padrão de operador (telas de
              custo, financeiro e configuração ficam fechadas por padrão).
            </p>

            {grupos.map((grupo) => (
              <div key={grupo}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {grupo}
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {TELAS_ADMIN.filter((tela) => tela.grupo === grupo).map((tela) => {
                    const marcado = permissoes[tela.chave] ?? tela.padraoOperador
                    return (
                      <label
                        key={tela.chave}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(e) =>
                            setPermissoes({ ...permissoes, [tela.chave]: e.target.checked })
                          }
                          className="h-4 w-4"
                        />
                        {tela.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Fechar
          </Button>
          {!ehAdmin && (
            <Button onClick={salvar} disabled={salvando || permissoes === null}>
              {salvando ? "Salvando..." : "Salvar permissões"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
