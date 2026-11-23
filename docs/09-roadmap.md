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
| 7.5 | Busca (com indexação da versão) | UC03 | F03 | ⏭️ | — | — |
| 7.6 | Meus Estudos | UC13 | F10 | ⏳ | — | — |
| 7.7 | Planos de leitura | UC07, UC08 | F07 | ⏳ | — | — |
| 7.8 | Versões (instalar e trocar) | UC09, UC10 | F08 | ⏳ | — | — |
| 7.9 | Backup e configurações de leitura | UC11, UC12 | — | ⏳ | — | — |
| — | **Release v1.0.0 — MVP entregue** | | | ⏳ | — | — |

### Candidatos do backlog por fase

Sugestão de encaixe, ainda **não planejados** (a decisão acontece na discussão de cada fase):

| Fase | Itens do backlog |
|---|---|
| 7.9 | BL-01 largura da leitura · BL-02 fonte · BL-03 tipo de folha · BL-05 `storage.persist()` · BL-07 modo foco |
| Após 7.6 | BL-04 painel lateral no desktop (depende de favoritos e anotações) |
| Qualquer fase | BL-06 teste E2E offline |

## Depois da v1.0

A definir a partir do [Backlog](08-backlog.md) e do escopo fora da v1.0 ([Visão §5.2](01-visao.md)).
