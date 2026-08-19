import { PastasNfConteudo } from "@/components/admin/pastas-nf-conteudo"

// Nao busca nada do banco: a configuracao de pasta vive no navegador do
// operador (ver lib/pastas-padrao.ts), nao no servidor.
export default function PastasNfPage() {
  return <PastasNfConteudo />
}
