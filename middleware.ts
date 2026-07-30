import { NextRequest, NextResponse } from "next/server"
import { lerTokenSessao } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

    const somenteAdmin =
      pathname.startsWith("/admin/usuarios") ||
      pathname.startsWith("/admin/auditoria") ||
      pathname.startsWith("/admin/clube")
    if (somenteAdmin && sessao.papel !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
