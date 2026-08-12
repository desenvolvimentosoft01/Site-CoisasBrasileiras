import { getConfiguracoes, getConfiguracoesMarca } from "@/lib/configuracoes"
import { resolverMarcaAtual } from "@/lib/marca"

export default async function TermosDeUsoPage() {
  const marca = await resolverMarcaAtual()
  const [config, configMarca] = await Promise.all([
    getConfiguracoes(["email_contato"]),
    getConfiguracoesMarca(["nome_loja"], marca),
  ])
  const nomeLoja = configMarca.nome_loja || "Coisas Brasileiras"
  const emailContato = config.email_contato || "contato@coisasbrasileiras.com.br"

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-emerald-950">Termos de Uso</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long" })}
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <p>
          Estes termos regem o uso do site da {nomeLoja}. Ao criar uma conta ou fazer um pedido, você
          concorda com as condições descritas abaixo.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">1. Cadastro e conta</h2>
          <p>
            Você é responsável por manter a confidencialidade da sua senha e por todas as atividades
            realizadas na sua conta. As informações fornecidas no cadastro devem ser verdadeiras e
            atualizadas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">2. Pedidos e pagamento</h2>
          <p>
            Preços e disponibilidade de estoque podem mudar sem aviso prévio. Um pedido só é confirmado
            após a aprovação do pagamento pelo Mercado Pago. Em caso de indisponibilidade de um item já
            pago, entraremos em contato pra combinar substituição, prazo estendido ou reembolso.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">3. Entrega</h2>
          <p>
            O prazo de entrega informado no checkout é uma estimativa da transportadora e pode variar por
            fatores fora do nosso controle. O frete é calculado com base no CEP e peso dos itens.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">4. Trocas e devoluções</h2>
          <p>
            Você tem direito de arrependimento em até 7 dias corridos após o recebimento do produto,
            conforme o Código de Defesa do Consumidor (art. 49), desde que o item esteja sem uso e na
            embalagem original. Produtos com defeito de fabricação podem ser trocados ou reembolsados a
            qualquer momento dentro do prazo de garantia legal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">5. Uso do site</h2>
          <p>
            É proibido usar o site pra fins ilegais, tentar acessar áreas restritas sem autorização, ou
            publicar avaliações falsas ou ofensivas. Reservamo-nos o direito de suspender contas que violem
            estas condições.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">6. Privacidade</h2>
          <p>
            O tratamento dos seus dados pessoais segue nossa{" "}
            <a href="/politica-de-privacidade" className="font-medium text-emerald-700 hover:underline">
              Política de Privacidade
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">7. Contato</h2>
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{" "}
            <a href={`mailto:${emailContato}`} className="font-medium text-emerald-700 hover:underline">{emailContato}</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
