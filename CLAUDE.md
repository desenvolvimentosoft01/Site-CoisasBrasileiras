# Coisas Brasileiras

## Acentuação

- **Texto visível ao usuário** (botões, labels, mensagens de toast/erro/sucesso, placeholders, títulos, textos de tela, e-mails enviados ao cliente) **sempre com acentuação correta em português**. Isso vale pro site público e pro painel admin. Nunca escrever "nao", "voce", "codigo", "numero", "opcao" etc. em texto que o usuário vai ler — é "não", "você", "código", "número", "opção".
- **Comentários de código** (`//`, `/* */`) continuam **sem acento**, de propósito (evita problema de encoding em alguns editores/terminais). Não confundir as duas convenções nem misturar uma com a outra.
- Ao criar ou editar qualquer tela, componente ou rota de API, revisar o texto literal que será renderizado/retornado ao usuário antes de finalizar.
- Para uma auditoria de acentuação em telas já existentes, usar a skill `revisar_acentuacao`.

## Revisão de qualidade

- Sempre que terminar de implementar uma feature nova ou corrigir um bug, antes de sugerir commit, chamar a skill `revisar_qualidade` (nomes de função/variável, indentação, comentários, typecheck/lint) e a `revisar_seguranca` (mobile, segurança, comentários). Corrigir o que for encontrado antes de reportar a tarefa como concluída.
- O hook `pre-commit` do Husky também roda `tsc --noEmit` e `npm run lint` automaticamente em todo commit — isso é uma trava adicional, não substitui a revisão acima.
