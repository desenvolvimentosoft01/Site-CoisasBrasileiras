// pathname.startsWith(href) sozinho da falso positivo quando um href e
// prefixo textual de outro (ex: "/admin/pedidos" e prefixo de
// "/admin/pedidos-compra") - exige que o pathname seja igual ao href ou
// continue com "/" (uma subrota de verdade, tipo "/admin/pedidos/123").
export function rotaAtiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
