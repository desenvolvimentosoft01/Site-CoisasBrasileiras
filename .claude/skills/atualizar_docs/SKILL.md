---
name: atualizar_docs
description: Atualiza os documentos do projeto Coisas Brasileiras (README e docs em DOCS/, quando existirem) para refletir o estado atual do código. Use quando o usuário pedir para "atualizar os docs", "atualizar a documentação", "sincronizar os manuais" ou similar.
---

Documentos hoje existentes:

- `README.md` — visão geral do projeto, stack, setup local e deploy.
- `DOCS/tecnico.md` — documento técnico interno: modelo de dados (resumo de cada migration), módulos do painel admin, integrações externas (Mercado Pago, PagBank, Bling, e-mail, Cloudinary), autenticação/autorização, sistema de abas MDI, cálculo de frete e fluxo de pedido/pagamento.

Ainda não existe, e deve ser criado quando fizer sentido (perguntar ao usuário antes):
- Um manual do painel administrativo, em linguagem não-técnica, para o dono da loja.

Ao ser chamada, siga este fluxo:

1. Rode `git log --oneline -30` e `git diff` (contra o último commit `docs:`, se houver) para identificar o que mudou no código desde a última vez que os docs foram tocados.
2. Para cada mudança relevante, identifique **qual documento** precisa de atualização:
   - Nova tabela/migration, novo módulo do admin, nova integração externa, mudança de fluxo de autenticação/pagamento/frete → `DOCS/tecnico.md`.
   - Mudança de stack, setup local, variáveis de ambiente ou deploy → `README.md`.
   - Se nenhum documento existente cobre o assunto (ex: manual do dono da loja), pergunte ao usuário se deve criar um antes de seguir.
3. Leia o documento afetado e edite apenas as seções relevantes — não reescreva o documento inteiro, a menos que ele ainda não tenha estrutura definida.
4. Ignore mudanças puramente internas sem efeito visível ou arquitetural (ex.: refactor sem mudança de comportamento, ajuste de estilo, correção de bug pontual) — não polua os docs com isso.
5. Ao final, liste para o usuário quais documentos foram alterados (ou criados) e um resumo de 1 linha por alteração.

Regras específicas deste projeto:
- Escreva em português, mantendo consistência de tom com o `README.md` existente.
- Ao final, pergunte se o usuário quer commitar as atualizações (use a skill `commit` se ele confirmar).
