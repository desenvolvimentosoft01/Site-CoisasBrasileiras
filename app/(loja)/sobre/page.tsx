import Image from "next/image"
import { query } from "@/lib/db"
import { getConfiguracoesMarca } from "@/lib/configuracoes"
import { resolverMarcaAtual } from "@/lib/marca"

type SobreNosMidia = {
  id: string
  tipo: "imagem" | "video_link" | "video_arquivo"
  url: string
  legenda: string | null
}

// Converte link do YouTube/Vimeo pro formato de embed - se nao reconhecer o
// dominio, usa o link como veio (cobre casos como Instagram, que ja aceita
// embed direto do link publico em alguns formatos).
function urlEmbedVideo(url: string): string {
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/)
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`

  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  return url
}

export default async function SobrePage() {
  const marca = await resolverMarcaAtual()
  const [config, midias] = await Promise.all([
    getConfiguracoesMarca(["nome_loja", "texto_sobre_nos"], marca),
    query("SELECT id, tipo, url, legenda FROM TAB_SOBRE_NOS_MIDIA ORDER BY ordem") as Promise<SobreNosMidia[]>,
  ])
  const nomeLoja = config.nome_loja || "Coisas Brasileiras"
  const paragrafos = (config.texto_sobre_nos || "").split(/\n{2,}/).filter((p) => p.trim())

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 md:px-6">
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

      {midias.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {midias.map((midia) =>
            midia.tipo === "imagem" ? (
              <figure key={midia.id} className="space-y-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-emerald-50">
                  <Image src={midia.url} alt={midia.legenda || "Sobre nós"} fill className="object-cover" />
                </div>
                {midia.legenda && <figcaption className="text-sm text-neutral-500">{midia.legenda}</figcaption>}
              </figure>
            ) : midia.tipo === "video_link" ? (
              <figure key={midia.id} className="space-y-2">
                <div className="aspect-video overflow-hidden rounded-lg bg-black">
                  <iframe
                    src={urlEmbedVideo(midia.url)}
                    title={midia.legenda || "Vídeo"}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {midia.legenda && <figcaption className="text-sm text-neutral-500">{midia.legenda}</figcaption>}
              </figure>
            ) : (
              <figure key={midia.id} className="space-y-2">
                <div className="aspect-video overflow-hidden rounded-lg bg-black">
                  <video src={midia.url} controls className="h-full w-full object-cover" />
                </div>
                {midia.legenda && <figcaption className="text-sm text-neutral-500">{midia.legenda}</figcaption>}
              </figure>
            )
          )}
        </div>
      )}
    </div>
  )
}
