import { ProdutoForm } from "@/components/admin/produto-form"

export default function NovoProdutoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo produto</h1>
      <ProdutoForm />
    </div>
  )
}
