import { getConfiguracoes } from "@/lib/configuracoes"
import { EntrarForm } from "@/components/admin/entrar-form"

// A tela de entrada apresenta o SISTEMA, nao a loja - por isso nao busca nome
// nem logo do cliente. A unica coisa que vem da configuracao e a cor, pra que
// cada instalacao tenha a cara de quem a usa sem precisar de tela propria.
export default async function EntrarPage() {
  const { cor_primaria } = await getConfiguracoes(["cor_primaria"])

  return <EntrarForm corPrimaria={cor_primaria || "#047857"} />
}
