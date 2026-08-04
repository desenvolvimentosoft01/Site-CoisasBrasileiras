# Coisas Brasileiras

## Acentuação

- **Texto visível ao usuário** (botões, labels, mensagens de toast/erro/sucesso, placeholders, títulos, textos de tela, e-mails enviados ao cliente) **sempre com acentuação correta em português**. Isso vale pro site público e pro painel admin. Nunca escrever "nao", "voce", "codigo", "numero", "opcao" etc. em texto que o usuário vai ler — é "não", "você", "código", "número", "opção".
- **Comentários de código** (`//`, `/* */`) continuam **sem acento**, de propósito (evita problema de encoding em alguns editores/terminais). Não confundir as duas convenções nem misturar uma com a outra.
- Ao criar ou editar qualquer tela, componente ou rota de API, revisar o texto literal que será renderizado/retornado ao usuário antes de finalizar.
- Para uma auditoria de acentuação em telas já existentes, usar a skill `revisar_acentuacao`.
