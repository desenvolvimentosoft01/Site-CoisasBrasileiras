import { exigirAdmin } from "@/lib/auth-servidor"
import { listarNotasFiscais } from "@/lib/notas-fiscais"
import { NextResponse } from "next/server"

// Usada pelo botao "Atualizar" da tela de Notas Fiscais - a carga inicial vem
// do server component (app/admin/notas-fiscais/page.tsx).
export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  return NextResponse.json(await listarNotasFiscais())
}
