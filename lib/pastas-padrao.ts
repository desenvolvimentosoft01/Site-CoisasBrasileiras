"use client"

// Pastas padrao para salvar e exportar XML/DANFE.
//
// POR QUE ISSO NAO E UM CAMPO DE TEXTO COM O CAMINHO:
// pagina web nao escreve num caminho digitado (ex: "C:\Notas") - o navegador
// bloqueia por seguranca, e nao ha como contornar. O que existe e a File
// System Access API: o operador ESCOLHE a pasta num seletor do sistema e o
// navegador devolve um "handle" com permissao pra aquela pasta. Esse handle
// pode ser guardado e reusado depois, que e o que da a sensacao de "pasta
// padrao configurada".
//
// POR QUE INDEXEDDB E NAO O BANCO:
// o handle e um objeto do navegador, nao um texto - nao da pra serializar em
// JSON nem gravar no Postgres. Ele so sobrevive no IndexedDB, via structured
// clone. Consequencia pratica, que a tela avisa: a configuracao vale POR
// NAVEGADOR E POR MAQUINA. Trocou de computador, escolhe de novo.
//
// Suportado no Chrome e no Edge. Firefox e Safari nao tem a API - por isso
// todo acesso passa por navegadorSuportaPastaPadrao() antes.

export type TipoPasta = "salvar" | "exportar"

const BANCO = "coisas-brasileiras-pastas"
const COLECAO = "handles"

// Tipagem minima da File System Access API: ainda nao esta na lib padrao do
// TypeScript, e so usamos esse subconjunto.
export type PastaEscolhida = {
  name: string
  getFileHandle: (
    nome: string,
    opcoes: { create: boolean }
  ) => Promise<{
    createWritable: () => Promise<{
      write: (dado: string | Uint8Array) => Promise<void>
      close: () => Promise<void>
    }>
  }>
  queryPermission?: (opcoes: { mode: "readwrite" }) => Promise<PermissionState>
  requestPermission?: (opcoes: { mode: "readwrite" }) => Promise<PermissionState>
}

type JanelaComSeletor = Window & {
  showDirectoryPicker?: (opcoes?: { mode?: "readwrite" }) => Promise<PastaEscolhida>
}

export function navegadorSuportaPastaPadrao(): boolean {
  return typeof window !== "undefined" && typeof (window as JanelaComSeletor).showDirectoryPicker === "function"
}

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolver, rejeitar) => {
    const requisicao = indexedDB.open(BANCO, 1)
    requisicao.onupgradeneeded = () => {
      if (!requisicao.result.objectStoreNames.contains(COLECAO)) {
        requisicao.result.createObjectStore(COLECAO)
      }
    }
    requisicao.onsuccess = () => resolver(requisicao.result)
    requisicao.onerror = () => rejeitar(requisicao.error)
  })
}

function executar<T>(modo: IDBTransactionMode, acao: (colecao: IDBObjectStore) => IDBRequest): Promise<T> {
  return abrirBanco().then(
    (banco) =>
      new Promise<T>((resolver, rejeitar) => {
        const transacao = banco.transaction(COLECAO, modo)
        const requisicao = acao(transacao.objectStore(COLECAO))
        requisicao.onsuccess = () => resolver(requisicao.result as T)
        requisicao.onerror = () => rejeitar(requisicao.error)
      })
  )
}

export async function guardarPasta(tipo: TipoPasta, pasta: PastaEscolhida): Promise<void> {
  await executar("readwrite", (colecao) => colecao.put(pasta, tipo))
}

export async function lerPasta(tipo: TipoPasta): Promise<PastaEscolhida | null> {
  if (!navegadorSuportaPastaPadrao()) return null
  try {
    return (await executar<PastaEscolhida | undefined>("readonly", (c) => c.get(tipo))) ?? null
  } catch {
    return null
  }
}

export async function esquecerPasta(tipo: TipoPasta): Promise<void> {
  await executar("readwrite", (colecao) => colecao.delete(tipo))
}

export async function escolherPasta(): Promise<PastaEscolhida | null> {
  const seletor = (window as JanelaComSeletor).showDirectoryPicker
  if (!seletor) return null

  try {
    return await seletor({ mode: "readwrite" })
  } catch {
    // Operador fechou o seletor sem escolher - cancelamento nao e erro.
    return null
  }
}

// O navegador pode pedir a permissao de novo depois de um tempo (ou nunca
// mais, se o operador marcou "permitir sempre"). Chamar antes de gravar
// evita o erro seco de permissao no meio do laco de arquivos.
export async function garantirPermissaoDeEscrita(pasta: PastaEscolhida): Promise<boolean> {
  if (!pasta.queryPermission || !pasta.requestPermission) return true

  if ((await pasta.queryPermission({ mode: "readwrite" })) === "granted") return true
  return (await pasta.requestPermission({ mode: "readwrite" })) === "granted"
}

// Grava um arquivo dentro da pasta. XML vai como texto; PDF chega em base64
// (JSON nao carrega binario) e volta a ser bytes aqui.
export async function gravarArquivoNaPasta(
  pasta: PastaEscolhida,
  nome: string,
  conteudo: string,
  ehBase64: boolean
): Promise<void> {
  const destino = await pasta.getFileHandle(nome, { create: true })
  const escrita = await destino.createWritable()
  await escrita.write(ehBase64 ? base64ParaBytes(conteudo) : conteudo)
  await escrita.close()
}

export function base64ParaBytes(base64: string): Uint8Array {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}
