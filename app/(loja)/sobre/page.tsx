import { getConfiguracoes } from "@/lib/configuracoes"

export default async function SobrePage() {
  const config = await getConfiguracoes(["nome_loja", "texto_sobre_nos"])
  const nomeLoja = config.nome_loja || "Coisas Brasileiras"
  const paragrafos = (config.texto_sobre_nos || "").split(/\n{2,}/).filter((p) => p.trim())

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6">
      <h1 className="font-heading text-3xl font-semibold text-emerald-950">Sobre nós</h1>

      {paragrafos.length > 0 ? (
        <div className="space-y-4 text-neutral-700">
          {paragrafos.map((paragrafo, indice) => (
            <p key={indice}>{paragrafo}</p>
          ))}
        </div>
      ) : (
        <p className="text-neutral-500">
          A {nomeLoja} ainda não cadastrou o texto desta página. Em breve, mais informações aqui.
        </p>
      )}
    </div>
  )
}
