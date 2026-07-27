import { getConfiguracoes } from "@/lib/configuracoes"
import { EntrarForm } from "@/components/admin/entrar-form"

export default async function EntrarPage() {
  const { logo_url, nome_loja, cor_primaria } = await getConfiguracoes([
    "logo_url",
    "nome_loja",
    "cor_primaria",
  ])

  return (
    <EntrarForm
      logoUrl={logo_url || undefined}
      nomeLoja={nome_loja || "Coisas Brasileiras"}
      corPrimaria={cor_primaria || "#047857"}
    />
  )
}
