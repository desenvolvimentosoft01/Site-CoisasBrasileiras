---
name: padrao-nova-tela
description: Verifica (ou aplica) se uma tela de cadastro do admin segue o padrão do projeto — BarraFerramentas, linha selecionável, botões Eye/Pencil/Trash2, ModalDetalhe. Use quando o usuário pedir para criar uma tela de cadastro nova, revisar se as telas estão padronizadas, ou mencionar "padrão das telas de cadastro", "olhinho em todas as telas", "consistência do admin".
---

Ao ser chamada, siga este fluxo:

1. Identifique o escopo: uma tela específica (`components/admin/*-conteudo.tsx`) ou todas. Se "todas", rode `Glob` em `components/admin/*-conteudo.tsx` e exclua telas que não são de cadastro simples (ex: `venda-balcao-conteudo.tsx`, `compras-conteudo.tsx`, `avaliacoes-conteudo.tsx`, `frete-faixas-conteudo.tsx` — essas têm fluxos próprios e não seguem 100% o padrão abaixo; confirme com o usuário antes de forçar o padrão nelas).

2. Para cada tela de cadastro no escopo, confira o checklist do padrão:
   - **Aba lista + Aba formulário** via `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (ou equivalente), nunca um formulário solto sem navegação.
   - **`BarraFerramentas`** (`components/admin/barra-ferramentas.tsx`) com botões Novo/Editar/Excluir no topo da tabela, habilitados/desabilitados conforme `linhaSelecionada`.
   - **Linha selecionável**: `useState<string | null>` para `linhaSelecionada`, `onClick` alterna seleção, `onDoubleClick` abre edição, classe `bg-amber-50` quando selecionada.
   - **Coluna de Ações** (`text-right`) na última coluna da tabela (ou no canto do card, se o layout for em grid de cards) com, nesta ordem: **Eye** (abrir `ModalDetalhe`) → **Pencil** (editar) → **Trash2** (excluir, `text-red-500`). Todos com `variant="ghost" size="icon-lg"` e `e.stopPropagation()` no onClick.
   - **`ModalDetalhe`** (`components/admin/modal-detalhe.tsx`): estado `const [detalhe, setDetalhe] = useState<Tipo | null>(null)`, renderizado no fim do componente com `aberto={!!detalhe}`, `onOpenChange={(aberto) => !aberto && setDetalhe(null)}`, `titulo` com o campo principal do registro, e `campos` listando os campos relevantes (não repetir todos os campos do formulário — só os que ajudam a identificar/conferir o registro rapidamente).
   - **Excluir** sempre passa por `useConfirmar()` com `descricao` e `destrutivo: true`.
   - **`registrarAuditoria`** chamado após cadastro/edição/exclusão bem-sucedidos.

3. Se estiver **criando uma tela nova**, use `components/admin/produtos-conteudo.tsx` como referência principal (é a mais completa) e implemente todos os itens do checklist desde o início — não adicione o Eye depois.

4. Se estiver **revisando telas existentes**, liste os desvios encontrados por arquivo (ex: "cupons-conteudo.tsx: falta ModalDetalhe") e aplique a correção com `Edit`, seguindo o mesmo padrão de import e posicionamento usado nas telas já padronizadas (`Eye` do lucide-react, `import { ModalDetalhe } from "@/components/admin/modal-detalhe"`, botão Eye antes do Pencil).

5. Depois de aplicar mudanças, rode `npx tsc --noEmit -p .` para garantir que compila antes de reportar como concluído.

Não force esse padrão em telas com fluxo fundamentalmente diferente (POS/carrinho, importação de XML, edição inline em massa) — nesses casos, avise o usuário do porquê e sugira uma adaptação pontual em vez de reescrever o fluxo.
