// Catálogo das telas do painel — a fonte única de verdade sobre "quem pode
// abrir o quê".
//
// Antes essa informação existia em DOIS lugares: as flags `somenteAdmin` do
// menu (components/admin/admin-shell.tsx) e a lista de rotas do middleware.
// Duas listas que precisam concordar sempre acabam discordando: foi o que
// aconteceu com Notas Fiscais, que nasceu escondida no menu mas acessível pela
// URL. Agora o menu e o middleware leem daqui.
//
// `padraoOperador` é o que o operador enxerga quando ninguém mexeu nas
// permissões dele. Permissão individual (migration 063) é exceção sobre esse
// padrão — mesmo modelo do plano de recursos: a regra vive no código, o banco
// guarda só quem foge dela.

export type ChaveTela =
  | "dashboard"
  | "venda_balcao"
  | "pedidos"
  | "orcamentos"
  | "clientes"
  | "produtos"
  | "categorias"
  | "estoque"
  | "precos"
  | "cotacoes"
  | "pedidos_compra"
  | "compras"
  | "fornecedores"
  | "transportadoras"
  | "notas_fiscais"
  | "financeiro"
  | "financeiro_contas"
  | "fluxo_caixa"
  | "cupons"
  | "banners"
  | "sobre_nos"
  | "feedbacks"
  | "avaliacoes"
  | "clube"
  | "relatorio_vendas"
  | "relatorio_lucro"
  | "relatorio_estoque"
  | "usuarios"
  | "configuracoes"
  | "pastas_nf"
  | "auditoria"

export type TelaAdmin = {
  chave: ChaveTela
  rota: string
  label: string
  grupo: string
  padraoOperador: boolean
}

export const TELAS_ADMIN: TelaAdmin[] = [
  { chave: "dashboard", rota: "/admin/dashboard", label: "Visão Geral", grupo: "Geral", padraoOperador: true },
  { chave: "venda_balcao", rota: "/admin/venda-balcao", label: "Pedido de Venda Balcão", grupo: "Vendas", padraoOperador: true },
  { chave: "pedidos", rota: "/admin/pedidos", label: "Pedidos", grupo: "Vendas", padraoOperador: true },
  { chave: "orcamentos", rota: "/admin/orcamentos", label: "Orçamentos", grupo: "Vendas", padraoOperador: true },
  { chave: "clientes", rota: "/admin/clientes", label: "Clientes", grupo: "Vendas", padraoOperador: true },

  { chave: "produtos", rota: "/admin/produtos", label: "Cadastro de Produtos", grupo: "Produtos", padraoOperador: true },
  { chave: "categorias", rota: "/admin/categorias", label: "Categorias", grupo: "Produtos", padraoOperador: true },
  { chave: "estoque", rota: "/admin/estoque", label: "Estoque", grupo: "Produtos", padraoOperador: true },
  // Reajuste de precos mexe na margem da loja inteira de uma vez.
  { chave: "precos", rota: "/admin/precos", label: "Reajuste de Preços", grupo: "Produtos", padraoOperador: false },

  // Compras inteira fica fora do padrao do operador: e onde aparece o CUSTO de
  // cada produto, que e o numero que o dono nao quer no balcao.
  { chave: "cotacoes", rota: "/admin/cotacoes", label: "Cotação", grupo: "Compras", padraoOperador: false },
  { chave: "pedidos_compra", rota: "/admin/pedidos-compra", label: "Pedido de Compra", grupo: "Compras", padraoOperador: false },
  { chave: "compras", rota: "/admin/compras", label: "Entrada de NF", grupo: "Compras", padraoOperador: false },
  { chave: "fornecedores", rota: "/admin/fornecedores", label: "Fornecedores", grupo: "Compras", padraoOperador: false },
  // Fica em Vendas, e nao em Compras: quem usa transportadora e quem despacha
  // o pedido, nao quem compra do fornecedor.
  { chave: "transportadoras", rota: "/admin/transportadoras", label: "Transportadoras", grupo: "Vendas", padraoOperador: true },

  { chave: "notas_fiscais", rota: "/admin/notas-fiscais", label: "Notas Fiscais", grupo: "Fiscal", padraoOperador: false },
  { chave: "financeiro", rota: "/admin/financeiro", label: "Resumo financeiro", grupo: "Financeiro", padraoOperador: false },
  { chave: "financeiro_contas", rota: "/admin/financeiro/contas", label: "Contas a pagar/receber", grupo: "Financeiro", padraoOperador: false },
  { chave: "fluxo_caixa", rota: "/admin/financeiro/fluxo-caixa", label: "Fluxo de caixa", grupo: "Financeiro", padraoOperador: false },

  { chave: "cupons", rota: "/admin/cupons", label: "Cupons", grupo: "Marketing", padraoOperador: true },
  { chave: "banners", rota: "/admin/banners", label: "Banners", grupo: "Marketing", padraoOperador: true },
  { chave: "sobre_nos", rota: "/admin/sobre-nos", label: "Sobre Nós", grupo: "Marketing", padraoOperador: true },
  { chave: "feedbacks", rota: "/admin/feedbacks", label: "Feedbacks", grupo: "Marketing", padraoOperador: true },
  { chave: "avaliacoes", rota: "/admin/avaliacoes", label: "Avaliações", grupo: "Marketing", padraoOperador: true },
  { chave: "clube", rota: "/admin/clube", label: "Clube", grupo: "Marketing", padraoOperador: false },

  { chave: "relatorio_vendas", rota: "/admin/relatorios", label: "Relatório de Vendas", grupo: "Relatórios", padraoOperador: true },
  // Lucro/DRE mostra margem e custo - mesma razao de Compras.
  { chave: "relatorio_lucro", rota: "/admin/relatorios/lucro", label: "Lucro / DRE", grupo: "Relatórios", padraoOperador: false },
  { chave: "relatorio_estoque", rota: "/admin/relatorios/estoque", label: "Relatório de Estoque", grupo: "Relatórios", padraoOperador: true },

  { chave: "usuarios", rota: "/admin/usuarios", label: "Usuários", grupo: "Configurações", padraoOperador: false },
  { chave: "configuracoes", rota: "/admin/configuracoes", label: "Configurações da Loja", grupo: "Configurações", padraoOperador: false },
  { chave: "pastas_nf", rota: "/admin/configuracoes/pastas-nf", label: "Pastas das Notas Fiscais", grupo: "Configurações", padraoOperador: false },
  { chave: "auditoria", rota: "/admin/auditoria", label: "Auditoria", grupo: "Configurações", padraoOperador: false },
]

// A tela que responde por uma URL. Usa a rota mais longa que casa, pra que
// "/admin/relatorios/lucro" nao seja confundida com "/admin/relatorios".
export function telaDaRota(pathname: string): TelaAdmin | undefined {
  return TELAS_ADMIN.filter((tela) => pathname === tela.rota || pathname.startsWith(`${tela.rota}/`)).sort(
    (a, b) => b.rota.length - a.rota.length
  )[0]
}

export type Permissoes = Record<string, boolean>

// Admin enxerga tudo, sempre - nao existe admin com tela bloqueada, senao
// ninguem consegue destravar o proprio sistema. Pro operador, vale o padrao da
// tela, a menos que exista exceção gravada pra ele.
export function podeAbrir(tela: TelaAdmin, papel: string, permissoes: Permissoes): boolean {
  if (papel === "admin") return true
  const excecao = permissoes[tela.chave]
  return excecao === undefined ? tela.padraoOperador : excecao
}
