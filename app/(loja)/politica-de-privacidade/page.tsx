import { getConfiguracoes, getConfiguracoesMarca } from "@/lib/configuracoes"
import { resolverMarcaAtual } from "@/lib/marca"

export default async function PoliticaDePrivacidadePage() {
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
        <h1 className="font-heading text-3xl font-semibold text-emerald-950">Política de Privacidade</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long" })}
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
        <p>
          Esta política explica como a {nomeLoja} coleta, usa e protege os dados pessoais dos seus
          clientes e visitantes, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">1. Quais dados coletamos</h2>
          <p>Coletamos os dados que você mesmo nos fornece ao criar uma conta, fazer um pedido ou entrar em contato:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Dados de identificação: nome, e-mail, telefone e CPF/CNPJ (quando informado).</li>
            <li>Dados de entrega: endereço completo (CEP, logradouro, número, complemento, bairro, cidade e estado).</li>
            <li>Dados de pedido: itens comprados, valores e status do pagamento (o número do cartão não passa pelos nossos servidores - quem processa é o Mercado Pago).</li>
            <li>Dados de navegação: mensagens enviadas pelo formulário de contato e avaliações de produtos que você publica.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">2. Para que usamos esses dados</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Processar e entregar seus pedidos, calcular frete e emitir nota fiscal.</li>
            <li>Autenticar seu acesso à sua conta e manter seu histórico de compras e lista de desejos.</li>
            <li>Enviar e-mails sobre o andamento do pedido (confirmação, pagamento, envio, entrega).</li>
            <li>Responder mensagens enviadas pelos canais de contato (formulário, e-mail, WhatsApp).</li>
            <li>Cumprir obrigações fiscais e legais (emissão de nota fiscal, guarda de registros contábeis).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">3. Com quem compartilhamos</h2>
          <p>Seus dados podem ser compartilhados apenas com prestadores de serviço necessários pra operação da loja:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Mercado Pago</strong>, pra processar pagamentos.</li>
            <li><strong>Frenet</strong> e transportadoras parceiras, pra calcular e realizar a entrega.</li>
            <li><strong>Bling</strong>, pra emissão de nota fiscal eletrônica.</li>
            <li>Órgãos públicos, quando exigido por lei ou ordem judicial.</li>
          </ul>
          <p>Nunca vendemos ou alugamos seus dados pessoais para terceiros.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">4. Por quanto tempo guardamos seus dados</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Dados de pedidos e notas fiscais são
            mantidos pelo prazo exigido pela legislação fiscal e civil brasileira (em geral, 5 anos), mesmo
            após o encerramento da conta, pra cumprir obrigações legais.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">5. Seus direitos</h2>
          <p>De acordo com a LGPD, você pode a qualquer momento:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Confirmar se tratamos seus dados e acessá-los.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a exclusão dos seus dados (respeitado o prazo legal de guarda de registros fiscais).</li>
            <li>Solicitar a portabilidade dos seus dados a outro fornecedor.</li>
            <li>Revogar o consentimento dado no cadastro.</li>
          </ul>
          <p>
            Você pode acessar e baixar seus dados, ou solicitar a exclusão da sua conta, diretamente na
            página <a href="/minha-conta" className="font-medium text-emerald-700 hover:underline">Minha Conta</a>.
            Outras dúvidas sobre seus dados podem ser enviadas para{" "}
            <a href={`mailto:${emailContato}`} className="font-medium text-emerald-700 hover:underline">{emailContato}</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-emerald-900">6. Segurança</h2>
          <p>
            Senhas são armazenadas de forma criptografada (hash), nunca em texto legível. O acesso aos
            dados de clientes no painel administrativo é restrito a usuários autenticados da equipe da loja.
          </p>
        </section>
      </div>
    </div>
  )
}
