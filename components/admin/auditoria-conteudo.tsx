"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export type RegistroAuditoria = {
  id: string
  usuario_nome: string | null
  tela: string
  acao: "cadastro" | "edicao" | "exclusao" | "inativacao" | "ativacao"
  tabela: string
  registro_id: string | null
  dados_antes: Record<string, unknown> | null
  dados_depois: Record<string, unknown> | null
  criado_em: string
}

const corAcao: Record<RegistroAuditoria["acao"], string> = {
  cadastro: "bg-emerald-600/20 text-emerald-400",
  edicao: "bg-blue-600/20 text-blue-400",
  exclusao: "bg-red-600/20 text-red-400",
  inativacao: "bg-slate-200 text-slate-500",
  ativacao: "bg-emerald-600/20 text-emerald-400",
}

export function AuditoriaConteudo({ registrosIniciais }: { registrosIniciais: RegistroAuditoria[] }) {
  const [busca, setBusca] = useState("")
  const [detalhe, setDetalhe] = useState<RegistroAuditoria | null>(null)

  const filtrados = registrosIniciais.filter((r) =>
    `${r.usuario_nome || ""} ${r.tela} ${r.tabela} ${r.acao}`.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Historico de cadastros, edicoes e exclusoes feitas no painel (ultimos 500 registros).
        </p>
      </div>

      <Input
        placeholder="Buscar por usuario, tela ou tabela..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Data</th>
                    <th className="p-4 font-medium">Usuario</th>
                    <th className="p-4 font-medium">Tela</th>
                    <th className="p-4 font-medium">Acao</th>
                    <th className="p-4 font-medium">Tabela</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((registro) => (
                    <tr
                      key={registro.id}
                      className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-accent/50"
                      onClick={() => setDetalhe(registro)}
                    >
                      <td className="p-4 whitespace-nowrap text-slate-500">
                        {new Date(registro.criado_em).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-4">{registro.usuario_nome || "-"}</td>
                      <td className="p-4 text-slate-500">{registro.tela}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-1 text-xs ${corAcao[registro.acao]}`}>
                          {registro.acao}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{registro.tabela}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {detalhe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDetalhe(null)}
        >
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardContent className="max-h-[80vh] space-y-4 overflow-y-auto pt-6">
              <h2 className="text-lg font-semibold">
                {detalhe.tela} — {detalhe.acao}
              </h2>
              <p className="text-sm text-muted-foreground">
                {detalhe.usuario_nome || "Sistema"} em{" "}
                {new Date(detalhe.criado_em).toLocaleString("pt-BR")}
              </p>

              {detalhe.dados_antes && (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Antes</p>
                  <pre className="overflow-x-auto rounded-md bg-slate-100 p-3 text-xs">
                    {JSON.stringify(detalhe.dados_antes, null, 2)}
                  </pre>
                </div>
              )}
              {detalhe.dados_depois && (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Depois</p>
                  <pre className="overflow-x-auto rounded-md bg-slate-100 p-3 text-xs">
                    {JSON.stringify(detalhe.dados_depois, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
