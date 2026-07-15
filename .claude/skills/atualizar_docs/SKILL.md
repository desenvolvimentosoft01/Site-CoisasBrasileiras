---
name: atualizar_docs
description: Atualiza os documentos do projeto Coisas Brasileiras (README e docs em DOCS/, quando existirem) para refletir o estado atual do código. Use quando o usuário pedir para "atualizar os docs", "atualizar a documentação", "sincronizar os manuais" ou similar.
---

Os documentos deste projeto ainda estão em formação. Hoje existe:

- `README.md` — visão geral do projeto, stack e como rodar localmente.

Conforme o projeto crescer, a expectativa é ter em `DOCS/` (criar a pasta quando o primeiro documento for necessário):
- Um documento técnico (arquitetura, stack, modelo de dados) para uso interno.
- Um manual do painel administrativo, para o dono da loja.

Ao ser chamada, siga este fluxo:

1. Rode `git log --oneline -30` e `git diff` (contra o último commit `docs:`, se houver) para identificar o que mudou no código desde a última vez que os docs foram tocados.
2. Para cada mudança relevante (nova tela do painel admin, novo módulo do site, nova tabela/migration, mudança de fluxo, nova integração como Bling/Mercado Pago), identifique **qual documento** precisa de atualização — se ainda não existir um documento adequado (ex: nenhum documento técnico em `DOCS/` ainda), pergunte ao usuário se deve criar um antes de seguir.
3. Leia o documento afetado e edite apenas as seções relevantes — não reescreva o documento inteiro, a menos que ele ainda não tenha estrutura definida.
4. Ignore mudanças puramente internas sem efeito visível ou arquitetural (ex.: refactor sem mudança de comportamento, ajuste de estilo, correção de bug pontual) — não polua os docs com isso.
5. Ao final, liste para o usuário quais documentos foram alterados (ou criados) e um resumo de 1 linha por alteração.

Regras específicas deste projeto:
- Escreva em português, mantendo consistência de tom com o `README.md` existente.
- Ao final, pergunte se o usuário quer commitar as atualizações (use a skill `commit` se ele confirmar).
