# 09 — Roadmap

Ordem das fases até o MVP (**v1.0.0**) e o status de cada uma. Cada fase é entregue em **um PR**; ao concluir, o próprio PR atualiza a linha da fase aqui (status, PR, data de entrega).

> **Sem datas previstas.** O roadmap registra a *ordem* e a data em que cada fase **foi** entregue, não promessas de prazo.
> Ideias ainda sem fase ficam no [Backlog](08-backlog.md); quando uma ideia é planejada, ela entra aqui.

**Legenda:** ✅ entregue · 🔨 em andamento · ⏭️ próxima · ⏳ pendente

## Fundação (documentação e setup)

| Fase | Entrega | Status | PR | Entregue em |
|---|---|---|---|---|
| 0–3 | Visão, requisitos, casos de uso e modelo de domínio (docs 01–04) | ✅ | #1 | 2026-11-22 |
| 4 | Wireframes das telas do MVP (docs 05) | ✅ | #1 | 2026-11-22 |
| 5 | Arquitetura, ADRs e padrões de desenvolvimento (docs 06–07) | ✅ | #2, #3 | 2026-11-22 |
| 6 | Setup do projeto: Vite, React, TS, qualidade, testes, PWA, CI/CD | ✅ | #4 | 2026-11-22 |

## MVP (fase 7)

| Fase | Entrega | Casos de uso | Funcionalidade | Status | PR | Entregue em |
|---|---|---|---|---|---|---|
| 7.1 | Leitura: versão BLIVRE embarcada, Dexie, página de papel, seletor de referência | UC01, UC02 | F01, F02, F09 | ✅ | #5 | 2026-11-22 |
| 7.2 | Favoritos: marcar/desmarcar pelo número do versículo (+ TanStack Query) | UC04 | F04 | ✅ | #7 | 2026-11-22 |
| 7.3 | Marca-texto: seleção ajustada a palavras, 4 cores, fusão/corte de sobreposições, borracha | UC05 | F05 | ✅ | #8 | 2026-11-22 |
| 7.4 | Anotações: rodapé numerado ou inline, Markdown básico, nota de versículo ou de destaque | UC06 | F06 | ✅ | #9 | 2026-11-22 |
| 7.5 | Busca: dinâmica, sem acentos, frase exata, filtros, aproximada, paginação, índice em Web Worker | UC03 | F03 | ✅ | #10 | 2026-11-22 |
| 7.6 | Meus Estudos: abas com total, filtro de texto e livro, ordem, paginação, menu de ações (+ busca nas anotações, RF02.9) | UC13 | F10 | ✅ | #11 | 2026-11-23 |
| 7.7 | Planos de leitura: catálogo, início com data (pelo calendário ou por livro), leitura do dia, atrasos, reagendar, faixa na leitura (+ tab bar no celular) | UC07, UC08 | F07 | ✅ | #13 | 2026-11-24 |
| 7.8 | Versões: tela Versões, instalar TB e ALM1911 (progresso, cancelar, tentar de novo), trocar a ativa mantendo o capítulo, remover (a padrão fica) | UC09, UC10 | F08 | ✅ | #15 | 2026-11-24 |
| 7.9 | Backup (exportar; importar juntando, com prévia) e configurações de leitura (botão Aa: tamanho e tema claro/sépia/escuro no app inteiro); armazenamento persistente (BL-05) | UC11, UC12 | — | ✅ | #16 | 2026-11-24 |
| — | **Release v1.0.0 — MVP entregue** ([CHANGELOG](../CHANGELOG.md)) | | | ✅ | #17 | 2026-11-24 |

### Candidatos do backlog por fase

Sugestão de encaixe, ainda **não planejados** (a decisão acontece na discussão de cada fase):

| Fase | Itens do backlog |
|---|---|
| 7.9 | ✅ inscrições de planos no backup · ✅ BL-05 `storage.persist()` · BL-01, BL-02 (família), BL-03 e BL-07 ficaram para depois da v1.0 |
| Após 7.6 | BL-04 painel lateral no desktop (depende de favoritos e anotações) |
| Qualquer fase | BL-06 teste E2E offline · BL-10 abas de Meus Estudos no celular · BL-11 wiki do projeto · BL-13 plano personalizado · BL-14 trocar versão pela leitura |

## Depois da v1.0

A definir a partir do [Backlog](08-backlog.md) e do escopo fora da v1.0 ([Visão §5.2](01-visao.md)). Candidatos já registrados: BL-15 importar tradução de um arquivo do usuário.
