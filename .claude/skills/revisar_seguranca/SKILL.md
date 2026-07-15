---
name: revisar_seguranca
description: Revisa mobile, segurança e comentários das mudanças recentes/pendentes do projeto Coisas Brasileiras. Use quando o usuário pedir para "revisar", "checar mobile", "checar segurança", "está seguro?", "está bem comentado?" ou após implementar uma feature grande, antes de sugerir commit.
---

Ao ser chamada, identifique o escopo (arquivos alterados desde o último commit via `git diff --name-only`, ou os arquivos que acabaram de ser criados/editados na conversa atual se não houver diff) e avalie três pontos, um por vez:

## A. Responsividade mobile
Para cada arquivo `.tsx` alterado, procure por:
- Larguras/alturas fixas em `px` que não colapsam em telas pequenas (~375-414px).
- `grid-cols-N` sem variante responsiva (`sm:`/`lg:`) quando o conteúdo é denso.
- Tabelas (`<table>`) sem wrapper com `overflow-x-auto` ou sem `min-w-[...]` que force o scroll horizontal em vez de espremer colunas.
- Modais que podem estourar a viewport (checar se herdam `max-h-[90vh] overflow-y-auto` do `components/ui/dialog.tsx`).
- Botões só-com-ícone menores que ~32px (alvo de toque recomendado é ~44px; abaixo de 32px é um problema real).
- Fluxos que dependem de hover puro (sem alternativa de clique/tap) para revelar ações importantes.
- No fluxo de carrinho/checkout em particular: campos de formulário (endereço, cartão/pix) com teclado adequado (`type="tel"`, `type="email"`, `inputmode="numeric"`) e botões de ação principais sempre visíveis sem precisar rolar excessivamente.

## B. Segurança
Este projeto usa **SQL puro com a lib `pg`** (sem ORM, sem RLS do Supabase) — a segurança de acesso a dados precisa ser garantida manualmente no código da aplicação:
- Toda query que recebe valor vindo do usuário usa **parâmetros** (`$1`, `$2`, ...) via `query(sql, params)` — nunca interpolação de string (`` `SELECT * FROM TAB_PRODUTO WHERE nome = '${busca}'` ``), o que abriria SQL injection.
- Rotas de API que alteram ou leem dados sensíveis (pedidos, dados de cliente, painel admin) verificam autenticação/sessão antes de tocar no banco — nunca confiam em um `id` vindo direto do body/query sem checar se pertence ao usuário logado.
- Senhas (cliente e usuário admin) sempre passam por `bcryptjs` (hash) antes de ir para `senha_hash` — nunca texto puro.
- Operações que alteram estado sensível (estoque, status de pedido, pagamento) têm proteção contra duplo-clique/chamada concorrente — idealmente com transação (`BEGIN`/`COMMIT`) e `SELECT ... FOR UPDATE` na linha afetada, não múltiplas queries separadas sem lock.
- Nenhum `dangerouslySetInnerHTML`, `eval`, ou construção de URL/HTML a partir de dado não confiável.
- Segredos (chaves do Mercado Pago, Bling, `DATABASE_URL`) só em variáveis de ambiente (`.env.local`), nunca hardcoded ou commitados.
- Ao integrar com APIs externas (Bling, Mercado Pago), tokens/webhooks validam a origem da requisição (assinatura/segredo compartilhado) antes de processar.

## C. Comentários
- Funções com lógica não-óbvia (regras de negócio, cálculo de frete/total, workarounds, decisões de UX específicas) têm um comentário curto explicando o *porquê*, não o *o quê*.
- Nenhum comentário órfão (explica um código que não existe mais) ou redundante (repete o que o nome da variável/função já diz).
- Se algo tem risco conhecido e aceito (ex: uma operação não é atômica de propósito), isso está anotado.
- Todos os comentários em **português**.

## Saída
Reporte um resumo curto por categoria (arquivo:linha — problema), igual a um code review: liste só o que for relevante, sem inflar a lista com observações óbvias. Se uma categoria não tiver achados, diga "sem problemas notáveis" — não invente ressalvas.

Se o usuário pedir para corrigir os achados, aplique as correções diretamente (Edit/Write) e rode `tsc --noEmit` + `next build` antes de reportar como concluído. Não commite automaticamente — isso é responsabilidade da skill `commit`, chamada separadamente.
