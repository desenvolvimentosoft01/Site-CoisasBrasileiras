"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight,
  Home,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  MousePointerClick,
} from "lucide-react"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { TabBarAdmin } from "@/components/admin/tab-bar"
import { ConfirmProvider } from "@/components/admin/confirm-provider"
import { Icone, type NomeIcone } from "@/components/admin/icone"
import type { SessaoAdmin } from "@/lib/auth"
import { EMAIL_DESENVOLVEDOR, NOME_SISTEMA, FABRICANTE_SISTEMA } from "@/lib/constantes"
import { rotaAtiva } from "@/lib/rota-ativa"
import { styleCoresTema } from "@/lib/cores"
import { ProvedorCores, useCoresTema } from "@/lib/contexto-cores"

// Cada modulo tem o seu icone proprio (public/icones - ver icone.tsx). Com o
// menu recolhido o icone e a unica coisa visivel do item, entao ele vai num
// quadrado de largura fixa pra nao dancar de um item pro outro.
type ItemLink = {
  tipo: "link"
  href: string
  label: string
  icone: NomeIcone
  somenteAdmin?: boolean
  somenteDesenvolvedor?: boolean
}
type ItemGrupo = {
  tipo: "grupo"
  label: string
  icone: NomeIcone
  filhos: { href: string; label: string; somenteAdmin?: boolean }[]
}
type ItemMenu = ItemLink | ItemGrupo

// Estrutura de menu igual ao InMenteGestao: itens soltos pras secoes mais
// usadas no dia a dia, agrupados em categorias colapsaveis pro resto.
const menu: ItemMenu[] = [
  { tipo: "link", href: "/admin/dashboard", label: "Visão Geral", icone: "visao_geral" },
  // Venda Balcao fica solta, e nao dentro de Vendas: e a tela que o operador
  // abre dezenas de vezes por dia, e cada clique a mais pra chegar nela custa
  // tempo no atendimento.
  { tipo: "link", href: "/admin/venda-balcao", label: "Venda Balcão", icone: "venda_balcao" },
  {
    tipo: "grupo",
    label: "Vendas",
    icone: "pedido_venda",
    filhos: [
      { href: "/admin/pedidos", label: "Pedido de Venda" },
      { href: "/admin/orcamentos", label: "Orçamentos" },
      { href: "/admin/clientes", label: "Clientes" },
    ],
  },
  {
    tipo: "grupo",
    label: "Produtos",
    icone: "produtos",
    filhos: [
      { href: "/admin/produtos", label: "Cadastro de Produtos" },
      { href: "/admin/categorias", label: "Categorias" },
      { href: "/admin/estoque", label: "Estoque" },
      { href: "/admin/precos", label: "Reajuste de Preços", somenteAdmin: true },
    ],
  },
  // Compras espelha Vendas: cada lado da operacao com os seus documentos e o
  // seu cadastro de parceiro (Clientes de um lado, Fornecedores do outro).
  {
    tipo: "grupo",
    label: "Compras",
    icone: "compras",
    filhos: [
      { href: "/admin/cotacoes", label: "Cotação", somenteAdmin: true },
      { href: "/admin/pedidos-compra", label: "Pedido de Compra", somenteAdmin: true },
      { href: "/admin/compras", label: "Entrada de NF", somenteAdmin: true },
      { href: "/admin/fornecedores", label: "Fornecedores", somenteAdmin: true },
    ],
  },
  // Fica solto (e nao dentro de Compras) porque junta entrada E saida - e o
  // lugar de pegar DANFE/XML de qualquer nota sem abrir o Bling.
  { tipo: "link", href: "/admin/notas-fiscais", label: "Notas Fiscais", icone: "notas_fiscais", somenteAdmin: true },
  { tipo: "link", href: "/admin/financeiro", label: "Financeiro", icone: "financeiro", somenteAdmin: true },
  {
    tipo: "grupo",
    label: "Marketing",
    icone: "marketing",
    filhos: [
      { href: "/admin/cupons", label: "Cupons" },
      { href: "/admin/banners", label: "Banners" },
      { href: "/admin/sobre-nos", label: "Sobre Nós" },
      { href: "/admin/feedbacks", label: "Feedbacks" },
      { href: "/admin/avaliacoes", label: "Avaliações" },
      { href: "/admin/clube", label: "Clube", somenteAdmin: true },
    ],
  },
  {
    tipo: "grupo",
    label: "Relatórios",
    icone: "relatorios",
    filhos: [
      { href: "/admin/relatorios", label: "Vendas" },
      { href: "/admin/relatorios/lucro", label: "Lucro / DRE", somenteAdmin: true },
      { href: "/admin/relatorios/estoque", label: "Estoque" },
    ],
  },
  // Auditoria saiu de Relatorios: ela nao e relatorio de negocio, e
  // administracao do sistema - o lugar dela e junto de Usuarios.
  {
    tipo: "grupo",
    label: "Configurações",
    icone: "configuracoes",
    filhos: [
      { href: "/admin/usuarios", label: "Usuários", somenteAdmin: true },
      { href: "/admin/configuracoes", label: "Configurações da Loja" },
      { href: "/admin/configuracoes/pastas-nf", label: "Pastas das Notas Fiscais" },
      { href: "/admin/auditoria", label: "Auditoria", somenteAdmin: true },
    ],
  },
  { tipo: "link", href: "/admin/cores", label: "Cores do Sistema", icone: "cores", somenteDesenvolvedor: true },
]

// Achata o menu (so os itens visiveis pro papel/email da sessao) pra
// alimentar a TabBar e o breadcrumb, que trabalham com uma lista simples de
// {href, label}.
function itensVisiveis(papel: string, email: string): { href: string; label: string; icone: NomeIcone }[] {
  const resultado: { href: string; label: string; icone: NomeIcone }[] = []
  for (const item of menu) {
    if (item.tipo === "link") {
      if (item.somenteDesenvolvedor && email !== EMAIL_DESENVOLVEDOR) continue
      if (!item.somenteAdmin || papel === "admin") resultado.push({ href: item.href, label: item.label, icone: item.icone })
    } else {
      for (const filho of item.filhos) {
        if (!filho.somenteAdmin || papel === "admin") {
          resultado.push({ href: filho.href, label: filho.label, icone: item.icone })
        }
      }
    }
  }
  return resultado
}

export function AdminShell({
  sessao,
  cores,
  logoUrl,
  nomeLoja,
  dominioBranco,
  plano,
  children,
}: {
  sessao: SessaoAdmin
  cores: Record<string, string>
  logoUrl?: string
  nomeLoja?: string
  dominioBranco?: string
  // Rotulo do plano contratado, so pra exibicao no cabecalho.
  plano?: string
  children: React.ReactNode
}) {
  return (
    <ProvedorCores coresIniciais={cores}>
      <AdminShellInterno
        sessao={sessao}
        logoUrl={logoUrl}
        nomeLoja={nomeLoja}
        dominioBranco={dominioBranco}
        plano={plano}
      >
        {children}
      </AdminShellInterno>
    </ProvedorCores>
  )
}

function AdminShellInterno({
  sessao,
  logoUrl,
  nomeLoja,
  dominioBranco,
  plano,
  children,
}: {
  sessao: SessaoAdmin
  logoUrl?: string
  nomeLoja?: string
  dominioBranco?: string
  // Rotulo do plano contratado, so pra exibicao no cabecalho.
  plano?: string
  children: React.ReactNode
}) {
  const { cores } = useCoresTema()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  // Menu recolhido (so icones) e o modo "abrir passando o mouse". Ficam no
  // localStorage porque sao preferencia de quem usa a maquina, e nao do
  // cadastro do usuario. Comecam falsos pra que servidor e cliente rendam
  // igual (evita erro de hidratacao); o valor salvo entra no efeito abaixo.
  const [menuRecolhido, setMenuRecolhido] = useState(false)
  const [abrirComHover, setAbrirComHover] = useState(false)
  const [mouseSobreMenu, setMouseSobreMenu] = useState(false)
  const [notasPendentesBling, setNotasPendentesBling] = useState(0)

  // Gesto de arrastar da borda esquerda pra abrir o menu (e arrastar pra
  // esquerda pra fechar), igual app nativo de celular. So dispara com o dedo
  // comecando perto da borda (< 24px) pra nao atrapalhar scroll/swipe normal
  // do conteudo da tela.
  const toqueInicioX = useRef<number | null>(null)
  const toqueInicioY = useRef<number | null>(null)

  function aoTocarInicio(evento: React.TouchEvent) {
    const x = evento.touches[0].clientX
    if (!sidebarAberta && x > 24) return
    toqueInicioX.current = x
    toqueInicioY.current = evento.touches[0].clientY
  }

  function aoTocarMover(evento: React.TouchEvent) {
    if (toqueInicioX.current === null || toqueInicioY.current === null) return
    const x = evento.touches[0].clientX
    const y = evento.touches[0].clientY
    const deltaX = x - toqueInicioX.current
    const deltaY = y - toqueInicioY.current
    if (Math.abs(deltaY) > Math.abs(deltaX)) return
    if (!sidebarAberta && deltaX > 60) {
      setSidebarAberta(true)
      toqueInicioX.current = null
      toqueInicioY.current = null
    } else if (sidebarAberta && deltaX < -60) {
      setSidebarAberta(false)
      toqueInicioX.current = null
      toqueInicioY.current = null
    }
  }

  function aoTocarFim() {
    toqueInicioX.current = null
    toqueInicioY.current = null
  }

  // Le do banco (atualizado pelo cron diario) - nao chama o Bling direto,
  // so pra mostrar um badge no menu "Compras" quando tem nota esperando.
  useEffect(() => {
    if (sessao.papel !== "admin") return
    fetch("/api/admin/bling/notas-pendentes-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => dados && setNotasPendentesBling(dados.notasPendentes))
      .catch(() => {})
  }, [sessao.papel])

  const planoDeMenu = itensVisiveis(sessao.papel, sessao.email)

  // Abre automaticamente o grupo que contem a pagina atual, pra nao esconder
  // onde o usuario esta logo na primeira renderizacao.
  const [gruposAbertos, setGruposAbertos] = useState<string[]>(() =>
    menu
      .filter(
        (item): item is ItemGrupo =>
          item.tipo === "grupo" && item.filhos.some((f) => rotaAtiva(pathname, f.href))
      )
      .map((item) => item.label)
  )

  function alternarGrupo(label: string) {
    setGruposAbertos((atual) => (atual.includes(label) ? atual.filter((g) => g !== label) : [...atual, label]))
  }

  useEffect(() => {
    // A leitura so pode acontecer no cliente (localStorage nao existe no
    // servidor), e por isso nao da pra usar como valor inicial do useState:
    // servidor e cliente renderizariam diferente. O microtask antes do
    // setState evita o render em cascata de mexer no estado ainda dentro do
    // corpo sincrono do efeito.
    async function aplicarPreferenciasSalvas() {
      await Promise.resolve()
      setMenuRecolhido(localStorage.getItem("admin_menu_recolhido") === "true")
      setAbrirComHover(localStorage.getItem("admin_menu_hover") === "true")
    }

    aplicarPreferenciasSalvas()
  }, [])

  function alternarMenuRecolhido() {
    setMenuRecolhido((atual) => {
      localStorage.setItem("admin_menu_recolhido", String(!atual))
      return !atual
    })
  }

  function alternarAberturaPorHover() {
    setAbrirComHover((atual) => {
      const novo = !atual
      localStorage.setItem("admin_menu_hover", String(novo))
      // Ligar o modo hover so faz sentido com o menu recolhido - senao nao ha
      // o que "abrir ao passar o mouse".
      if (novo) {
        setMenuRecolhido(true)
        localStorage.setItem("admin_menu_recolhido", "true")
      }
      return novo
    })
  }

  // O menu aparece expandido quando nao esta recolhido OU quando esta
  // recolhido, o modo hover esta ligado e o mouse esta sobre ele.
  const menuExpandido = !menuRecolhido || (abrirComHover && mouseSobreMenu)

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/entrar")
    router.refresh()
  }

  const iniciais = sessao.nome
    .trim()
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Link do Porcelanas Brancas precisa de URL absoluta (host diferente do
  // admin) - reaproveita protocolo/porta da aba atual, so troca o host pelo
  // dominio configurado em DOMINIO_BRANCO. Calculado so no client (useEffect)
  // pra nao dar mismatch de hidratacao entre servidor (sem "window") e
  // navegador.
  const [urlPorcelanasBrancas, setUrlPorcelanasBrancas] = useState<string | null>(null)
  useEffect(() => {
    if (!dominioBranco) return
    const { protocol, port } = window.location
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le "window", so existe apos montar no client
    setUrlPorcelanasBrancas(`${protocol}//${dominioBranco}${port ? `:${port}` : ""}`)
  }, [dominioBranco])

  const paginaAtual = planoDeMenu.find((item) => rotaAtiva(pathname, item.href))

  // Breadcrumb simples a partir do path atual - so mostra a secao (nao
  // segmenta por UUID/subpaginas como o InMenteGestao, porque nossas rotas
  // de detalhe usam "/admin/pedidos/[id]" com um so nivel relevante).
  const migalhas = paginaAtual ? [{ href: paginaAtual.href, label: paginaAtual.label }] : []

  return (
    // Tema sempre claro, igual ao InMenteGestao (decisao deles: nao seguir o
    // tema escuro do SO do operador, evita variaveis de dark mode aplicadas
    // sem querer). "h-screen overflow-hidden" no shell inteiro + "min-h-0" no
    // <main> e o que garante que SO o conteudo rola - sem isso (como estava
    // antes, com "min-h-screen"), a pagina inteira crescia e a sidebar (que
    // tem altura fixa de tela) "acabava" no meio da rolagem, bagunçando o
    // layout.
    <ConfirmProvider>
    <div
      className="flex h-screen overflow-hidden bg-slate-100"
      style={styleCoresTema(cores)}
      onTouchStart={aoTocarInicio}
      onTouchMove={aoTocarMover}
      onTouchEnd={aoTocarFim}
    >
      <Toaster position="top-right" richColors />
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* Espaco que o menu ocupa no desktop. Existe separado do <aside>
          porque, quando o menu abre passando o mouse, ele vira uma camada por
          CIMA do conteudo - sem esse espaco fixo, a tela inteira andaria pro
          lado a cada passada de mouse, que e desconfortavel de usar. */}
      <div
        className={`hidden shrink-0 transition-[width] duration-200 lg:block ${
          menuRecolhido ? "w-14" : "w-56"
        }`}
      />

      <aside
        onMouseEnter={() => setMouseSobreMenu(true)}
        onMouseLeave={() => setMouseSobreMenu(false)}
        className={`fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col bg-slate-900 transition-all duration-200 ease-in-out lg:translate-x-0 ${
          sidebarAberta ? "translate-x-0" : "-translate-x-full"
        } ${menuExpandido ? "w-56" : "w-56 lg:w-14"} ${
          menuRecolhido && mouseSobreMenu ? "lg:shadow-2xl lg:shadow-black/40" : ""
        }`}
      >
        <div
          className={`flex items-center gap-2.5 border-b border-slate-800 py-5 ${
            menuExpandido ? "px-4" : "px-4 lg:justify-center lg:px-0"
          }`}
        >
          <Image src={logoUrl || "/logo.webp"} alt="" width={32} height={32} className="shrink-0 rounded-lg" />
          <div className={menuExpandido ? "" : "lg:hidden"}>
            <p className="whitespace-nowrap text-sm font-bold leading-tight text-white">
              {nomeLoja || "Coisas Brasileiras"}
            </p>
            <p className="text-[10px] text-slate-400">{NOME_SISTEMA}</p>
          </div>
        </div>

        {/* Rola quando o menu nao cabe na altura da janela, mas sem desenhar
            barra por cima dos itens - o mesmo tratamento das abas e da trilha
            de navegacao. */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {menu.map((item) => {
            if (item.tipo === "link") {
              if (item.somenteAdmin && sessao.papel !== "admin") return null
              if (item.somenteDesenvolvedor && sessao.email !== EMAIL_DESENVOLVEDOR) return null
              const ativo = rotaAtiva(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarAberta(false)}
                  // Com o menu recolhido o rotulo some, entao o title vira a
                  // unica forma de saber o que e o icone.
                  title={menuExpandido ? undefined : item.label}
                  className={`flex w-full items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium transition-all ${
                    menuExpandido ? "px-3" : "px-3 lg:justify-center lg:px-0"
                  } ${
                    ativo
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex w-5 shrink-0 justify-center">
                    <Icone nome={item.icone} tamanho={18} />
                  </span>
                  <span className={menuExpandido ? "whitespace-nowrap" : "lg:hidden"}>{item.label}</span>
                </Link>
              )
            }

            const filhosVisiveis = item.filhos.filter((f) => !f.somenteAdmin || sessao.papel === "admin")
            if (filhosVisiveis.length === 0) return null

            const aberto = gruposAbertos.includes(item.label)
            const grupoAtivo = filhosVisiveis.some((f) => rotaAtiva(pathname, f.href))

            return (
              <div key={item.label}>
                <button
                  // Recolhido, clicar no grupo expande o menu em vez de abrir
                  // um submenu que ninguem conseguiria ler.
                  onClick={() => (menuExpandido ? alternarGrupo(item.label) : alternarMenuRecolhido())}
                  title={menuExpandido ? undefined : item.label}
                  className={`flex w-full items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium transition-all ${
                    menuExpandido ? "px-3" : "px-3 lg:justify-center lg:px-0"
                  } ${grupoAtivo ? "text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                >
                  <span className="relative shrink-0">
                    <span className="flex w-5 justify-center">
                      <Icone nome={item.icone} tamanho={18} />
                    </span>
                    {/* Recolhido nao ha espaco pro numero, mas some-lo por
                        completo esconderia que ha nota esperando - vira um
                        ponto no canto do icone. */}
                    {item.label === "Compras" && notasPendentesBling > 0 && !menuExpandido && (
                      <span className="absolute -right-1 -top-1 hidden h-2 w-2 rounded-full bg-amber-500 lg:block" />
                    )}
                  </span>
                  <span className={`flex-1 text-left ${menuExpandido ? "whitespace-nowrap" : "lg:hidden"}`}>
                    {item.label}
                  </span>
                  {item.label === "Compras" && notasPendentesBling > 0 && (
                    <span
                      className={`rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white ${
                        menuExpandido ? "" : "lg:hidden"
                      }`}
                    >
                      {notasPendentesBling}
                    </span>
                  )}
                  <ChevronDown
                    size={12}
                    className={`text-slate-500 transition-transform ${aberto ? "rotate-180" : ""} ${
                      menuExpandido ? "" : "lg:hidden"
                    }`}
                  />
                </button>

                {aberto && menuExpandido && (
                  <div className="mb-1 ml-6 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                    {filhosVisiveis.map((filho) => {
                      const ativo = rotaAtiva(pathname, filho.href)
                      return (
                        <Link
                          key={filho.href}
                          href={filho.href}
                          onClick={() => setSidebarAberta(false)}
                          className={`block rounded-md px-2 py-1.5 text-left text-[12px] font-medium transition-all ${
                            ativo
                              ? "bg-slate-800 text-[var(--primary)]"
                              : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                          }`}
                        >
                          {filho.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Controles do menu: so no desktop - no celular o menu e uma gaveta
            que abre pelo botao do cabecalho, e hover nao existe em toque. */}
        <div
          className={`hidden border-t border-slate-800 py-2 lg:flex lg:items-center ${
            menuExpandido ? "justify-end gap-1 px-2" : "flex-col gap-1 px-0"
          }`}
        >
          <button
            onClick={alternarAberturaPorHover}
            title={
              abrirComHover
                ? "Desligar a abertura automática ao passar o mouse"
                : "Abrir o menu automaticamente ao passar o mouse"
            }
            aria-pressed={abrirComHover}
            className={`rounded-lg p-2 transition-colors ${
              abrirComHover
                ? "bg-[var(--primary)] text-white"
                : "text-slate-500 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <MousePointerClick size={16} />
          </button>
          <button
            onClick={alternarMenuRecolhido}
            title={menuRecolhido ? "Fixar o menu aberto" : "Recolher o menu"}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {menuRecolhido ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <div
          className={`flex items-center gap-3 border-t border-slate-800 py-4 ${
            menuExpandido ? "px-4" : "px-4 lg:justify-center lg:px-0"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
            {iniciais}
          </div>
          <div className={`flex-1 overflow-hidden ${menuExpandido ? "" : "lg:hidden"}`}>
            <div className="truncate text-sm font-medium text-white">{sessao.nome}</div>
            <div className="truncate text-xs capitalize text-slate-400">{sessao.papel}</div>
            {/* Trocar a propria senha fica junto do nome, e nao em
                Configuracoes: e uma acao sobre a pessoa, nao sobre a loja - e
                o operador nem enxerga o menu de Configuracoes. */}
            <Link
              href="/admin/trocar-senha"
              className="text-[11px] text-slate-500 transition-colors hover:text-slate-300"
            >
              Trocar minha senha
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6">
          <nav className="flex min-w-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              className="-ml-1 mr-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              onClick={() => setSidebarAberta((v) => !v)}
              aria-label="Menu"
            >
              <Menu size={18} />
            </button>
            <Link href="/admin/dashboard" className="text-slate-400 transition-colors hover:text-slate-600">
              <Home size={14} />
            </Link>
            {migalhas.map((m) => (
              <span key={m.href} className="flex items-center gap-1.5">
                <ChevronRight size={13} className="text-slate-300" />
                <span className="font-semibold text-slate-700">{m.label}</span>
              </span>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 sm:flex"
              title="Abrir o site Coisas Brasileiras em uma nova aba"
            >
              <ArrowLeft size={14} />
              🎨 Coisas Brasileiras
            </Link>
            {urlPorcelanasBrancas && (
              <a
                href={urlPorcelanasBrancas}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 sm:flex"
                title="Abrir o site Porcelanas Brancas em uma nova aba"
              >
                ⚪ Porcelanas Brancas
              </a>
            )}
            {/* Selo do plano, como no InMenteGestao: o cliente ve o que ele
                tem contratado sem precisar perguntar, e a gente descobre na
                hora do suporte em que plano aquela instalacao esta. */}
            {plano && (
              <span
                className="hidden items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 lg:inline-flex"
                title="Plano contratado desta instalação"
              >
                {nomeLoja || "Loja"}
                <span className="rounded-full bg-amber-200/70 px-1.5 py-0.5 text-[10px]">{plano}</span>
              </span>
            )}
            <span className="hidden text-xs font-semibold text-slate-500 sm:block">{sessao.nome}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </header>

        <TabBarAdmin itensMenu={planoDeMenu} />

        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
          {/* So na impressao: qualquer papel que sai do sistema (relatorio,
              auditoria, lista) diz de onde veio e quando foi impresso - a
              mesma assinatura que vai no rodape do DANFE e do orcamento. */}
          <p className="mt-6 hidden text-right text-[9px] text-slate-500 print:block">
            {NOME_SISTEMA} — {FABRICANTE_SISTEMA} · impresso em{" "}
            {new Date().toLocaleString("pt-BR")}
          </p>
        </main>
      </div>
    </div>
    </ConfirmProvider>
  )
}
