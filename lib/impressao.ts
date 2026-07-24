// Impressao via print nativo do navegador (window.print), estilizado com CSS
// @media print - nao gera PDF nem abre nova aba. Mesmo padrao do in-mente-gestao.
export type OrientacaoImpressao = "retrato" | "paisagem"

// Espera as imagens da pagina carregarem antes de imprimir - sem isso o
// Chrome pode mostrar o icone de imagem quebrada (ex: logo) na impressao.
function aguardarImagens(): Promise<void> {
  const imagens = Array.from(document.images).filter((img) => !img.complete)
  if (imagens.length === 0) return Promise.resolve()
  return Promise.all(
    imagens.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true })
          img.addEventListener("error", () => resolve(), { once: true })
        })
    )
  ).then(() => undefined)
}

export async function imprimirPagina(orientacao: OrientacaoImpressao = "retrato") {
  const estilo = document.createElement("style")
  estilo.textContent = `@page { size: A4 ${orientacao === "paisagem" ? "landscape" : "portrait"}; margin: 12mm; }`
  document.head.appendChild(estilo)

  await aguardarImagens()
  window.print()

  // "afterprint" nao dispara de forma confiavel em todos os navegadores -
  // remove a tag de estilo depois de um tempo, so pra nao poluir o head.
  setTimeout(() => estilo.remove(), 2000)
}
