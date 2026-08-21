import { NextRequest, NextResponse } from "next/server"
import { lerTokenSessao, EMAIL_DESENVOLVEDOR } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin") {
    const sessao = await lerTokenSessao(request.cookies.get("admin_sessao")?.value)
    const url = request.nextUrl.clone()
    url.pathname = sessao ? "/admin/dashboard" : "/admin/entrar"
    return NextResponse.redirect(url)
  }

  if (pathname === "/admin/entrar") {
    const sessao = await lerTokenSessao(request.cookies.get("admin_sessao")?.value)
    if (sessao) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/dashboard"
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (pathname.startsWith("/admin")) {
    const sessao = await lerTokenSessao(request.cookies.get("admin_sessao")?.value)

    if (!sessao) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/entrar"
      return NextResponse.redirect(url)
    }

    // Senha provisoria bloqueia o painel inteiro ate ser trocada. Fica antes
    // das checagens de papel de proposito: nao interessa o que a pessoa pode
    // acessar enquanto o acesso ainda e uma senha que outra pessoa escolheu.
    if (sessao.senhaProvisoria && !pathname.startsWith("/admin/trocar-senha")) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/trocar-senha"
      url.search = ""
      return NextResponse.redirect(url)
    }

    // A lista de telas restritas ficava escrita aqui, duplicando as flags do
    // menu - duas listas que precisam concordar sempre acabam discordando (foi
    // o que aconteceu com Notas Fiscais, escondida no menu e aberta pela URL).
    //
    // Agora quem decide e a permissao por tela, checada no layout do admin,
    // que alcanca o banco. O middleware roda no edge e nao alcanca - por isso
    // so cuida do que da pra decidir com o token: sessao e desenvolvedor.

    // Plano e Cores sao telas de quem mantem o sistema, nao do cliente: quem
    // define o que a instalacao enxerga nao pode ser quem usa a instalacao.
    if (
      (pathname.startsWith("/admin/cores") || pathname.startsWith("/admin/plano")) &&
      sessao.email !== EMAIL_DESENVOLVEDOR
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // O layout do admin precisa saber QUAL tela esta sendo aberta pra checar a
  // permissao no banco (migration 063), e layout do App Router nao recebe o
  // pathname. O middleware repassa por cabecalho.
  //
  // A checagem fina fica no layout, e nao aqui, porque o middleware roda no
  // edge e nao alcanca o banco - e permissao guardada no token ficaria velha
  // ate o proximo login.
  const cabecalhos = new Headers(request.headers)
  cabecalhos.set("x-pathname", pathname)
  return NextResponse.next({ request: { headers: cabecalhos } })
}

export const config = {
  matcher: ["/admin/:path*"],
}
