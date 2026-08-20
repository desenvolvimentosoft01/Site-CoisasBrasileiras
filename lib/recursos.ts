import { query } from "@/lib/db"

// Recursos que o plano contratado libera ou não nesta instalação.
//
// O catalogo fica aqui no codigo, e nao no banco: recurso e regra de produto,
// muda junto com a tela que ele libera, e nasce numa migration so quando
// alguem precisa DESLIGAR. O banco (TAB_RECURSO) guarda so as excecoes.
//
// Recurso ausente da tabela vale como LIGADO - assim um recurso novo entra em
// producao funcionando pra quem ja usa o sistema, em vez de sumir da tela de
// todo mundo ate alguem lembrar de habilitar.

export type ChaveRecurso =
  | "integracao_mercado_livre"
  | "integracao_shopee"
  | "integracao_ifood"
  | "integracao_bling"
  | "integracao_mercado_pago"
  | "integracao_frenet"
  | "modulo_compras"
  | "modulo_financeiro"
  | "modulo_notas_fiscais"
  | "modulo_orcamentos"
  | "modulo_clube"
  | "modulo_marketing"
  | "modulo_relatorios"

export type Plano = "basico" | "intermediario" | "avancado" | "personalizado"

export const CATALOGO_RECURSOS: {
  chave: ChaveRecurso
  nome: string
  descricao: string
  grupo: "Integrações" | "Módulos"
}[] = [
  {
    chave: "integracao_mercado_livre",
    nome: "Mercado Livre",
    descricao: "Importa pedidos do Mercado Livre pelo Bling. Desligado, o campo da loja e o canal somem das telas.",
    grupo: "Integrações",
  },
  {
    chave: "integracao_shopee",
    nome: "Shopee",
    descricao: "Importa pedidos da Shopee pelo Bling. Desligado, o campo da loja e o canal somem das telas.",
    grupo: "Integrações",
  },
  {
    chave: "integracao_ifood",
    nome: "iFood",
    descricao:
      "Importa pedidos do iFood. Existe no InMenteGestao e ainda nao esta finalizada - fica desligada aqui ate ser concluida.",
    grupo: "Integrações",
  },
  {
    chave: "integracao_bling",
    nome: "Bling (NF-e)",
    descricao: "Emissão e cancelamento de NF-e pelo Bling, e a busca das notas de entrada.",
    grupo: "Integrações",
  },
  {
    chave: "integracao_mercado_pago",
    nome: "Mercado Pago",
    descricao: "Pagamento online no checkout da loja (Pix, cartão e boleto).",
    grupo: "Integrações",
  },
  {
    chave: "integracao_frenet",
    nome: "Frenet",
    descricao: "Cálculo de frete e rastreio pelas transportadoras integradas.",
    grupo: "Integrações",
  },
  { chave: "modulo_compras", nome: "Compras", descricao: "Cotação, pedido de compra, entrada de NF e fornecedores.", grupo: "Módulos" },
  { chave: "modulo_financeiro", nome: "Financeiro", descricao: "Contas a pagar e a receber.", grupo: "Módulos" },
  { chave: "modulo_notas_fiscais", nome: "Notas Fiscais", descricao: "Central de DANFE e XML de entrada e saída.", grupo: "Módulos" },
  { chave: "modulo_orcamentos", nome: "Orçamentos", descricao: "Orçamento com envio e aprovação por link.", grupo: "Módulos" },
  { chave: "modulo_clube", nome: "Clube", descricao: "Assinatura mensal com preço especial para membros.", grupo: "Módulos" },
  { chave: "modulo_marketing", nome: "Marketing", descricao: "Cupons, banners, Sobre Nós, feedbacks e avaliações.", grupo: "Módulos" },
  { chave: "modulo_relatorios", nome: "Relatórios", descricao: "Vendas, Lucro/DRE e estoque.", grupo: "Módulos" },
]

// O que cada plano libera. "personalizado" nao aparece aqui de proposito: e o
// rotulo de quando o desenvolvedor mexe num recurso individual, e ai o
// conjunto deixa de bater com qualquer plano fechado.
export const RECURSOS_POR_PLANO: Record<Exclude<Plano, "personalizado">, ChaveRecurso[]> = {
  basico: ["integracao_mercado_pago", "integracao_frenet", "modulo_marketing", "modulo_relatorios"],
  intermediario: [
    "integracao_mercado_pago",
    "integracao_frenet",
    "integracao_bling",
    "modulo_marketing",
    "modulo_relatorios",
    "modulo_orcamentos",
    "modulo_financeiro",
    "modulo_notas_fiscais",
  ],
  avancado: CATALOGO_RECURSOS.map((recurso) => recurso.chave),
}

export const ROTULO_PLANO: Record<Plano, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
  personalizado: "Personalizado",
}

export type Recursos = Record<ChaveRecurso, boolean>

// Le a tabela de excecoes e devolve o mapa completo, ja com o padrao "ligado"
// pros recursos que ninguem desligou.
export async function carregarRecursos(): Promise<Recursos> {
  const linhas = await query("SELECT chave, habilitado FROM TAB_RECURSO")
  const excecoes = new Map(linhas.map((linha) => [String(linha.chave), Boolean(linha.habilitado)]))

  const recursos = {} as Recursos
  for (const recurso of CATALOGO_RECURSOS) {
    recursos[recurso.chave] = excecoes.get(recurso.chave) ?? true
  }
  return recursos
}

export async function recursoLigado(chave: ChaveRecurso): Promise<boolean> {
  const [linha] = await query("SELECT habilitado FROM TAB_RECURSO WHERE chave = $1", [chave])
  return linha ? Boolean(linha.habilitado) : true
}

// O plano so e "avancado"/"intermediario"/"basico" enquanto o conjunto de
// recursos ligados bate exatamente com o do plano. Assim o cliente nunca ve
// "Plano Avançado" numa instalacao onde alguma coisa foi desligada na mao -
// que era o caso do Coisas Brasileiras (avancado, menos os marketplaces).
export function planoEfetivo(planoContratado: string, recursos: Recursos): Plano {
  const ligados = CATALOGO_RECURSOS.filter((recurso) => recursos[recurso.chave]).map((r) => r.chave)

  for (const [plano, chaves] of Object.entries(RECURSOS_POR_PLANO)) {
    const mesmaQuantidade = chaves.length === ligados.length
    if (mesmaQuantidade && chaves.every((chave) => ligados.includes(chave))) {
      return plano as Plano
    }
  }

  // Sem correspondencia exata com nenhum plano fechado: e um recorte proprio
  // (o caso do Coisas Brasileiras - avancado, menos os marketplaces e o
  // iFood). Chamar isso de "Avançado" seria mentira na tela do cliente.
  return "personalizado"
}

// Rotulo pra mostrar ao cliente: o plano contratado, e entre parenteses o
// aviso de que a instalacao dele tem um recorte proprio.
export function rotuloPlanoParaCliente(planoContratado: string, recursos: Recursos): string {
  const efetivo = planoEfetivo(planoContratado, recursos)
  const contratado = ROTULO_PLANO[planoContratado as Plano] ?? planoContratado

  if (efetivo !== "personalizado") return ROTULO_PLANO[efetivo]
  return `${contratado} (personalizado)`
}
