# 05 — Wireframes

| Campo | Valor |
|---|---|
| Versão | 0.1 (rascunho) |
| Data | 2026-11-22 |
| Fidelidade | Baixa/média — estrutura, hierarquia e comportamento |
| Status | Em revisão |

> **Fonte:** [`index.html`](index.html) (abra localmente no navegador para ver interativo).
> As imagens abaixo são capturas da página, geradas para visualização no GitHub.
> Os círculos azuis numerados remetem às notas de cada tela (com rastreabilidade para RF/UC).

## Navegação principal

`Ler · Buscar · Planos · Meus Estudos · Versões` — barra superior no desktop, *tab bar* inferior no celular.

## 1. Leitura — desktop
UC01 · UC04 · UC05 · UC06 — página de papel, marca-texto, favoritos, notas inline e de rodapé, barra flutuante de seleção.

![Leitura desktop](img/wf-leitura.png)

> **Implementado na fase 7.2 (UC04):** favoritar não depende de selecionar texto. O **número do versículo** é um botão que abre uma **barra de ações do versículo** fixa no rodapé (desktop e celular), acessível pelo teclado. A barra flutuante de seleção do wireframe continua prevista para o marca-texto (UC05, fase 7.3).

## 1b. Leitura — celular
Seleção abre *bottom sheet* com ações e cores.

![Leitura celular](img/wf-leitura-m.png)

## 2. Busca
UC03 — busca dinâmica, modos, filtros, resultados paginados.

![Busca](img/wf-busca.png)

## 3. Meus Estudos
UC13 — abas Favoritos / Destaques / Anotações, filtro, ordenação, paginação.

![Meus Estudos](img/wf-estudos.png)

## 4. Planos de leitura
UC07 · UC08 — progresso, leitura do dia, atrasos, reagendamento, catálogo.

![Planos](img/wf-planos.png)

## 5. Versões
UC09 · UC10 — instaladas, disponíveis, progresso de instalação.

![Versões](img/wf-versoes.png)

## 6. Navegação — seletor de livro e capítulo
UC01 (A1) · UC02 — desktop (popover) e celular (tela cheia com acordeão).

![Navegação](img/wf-navegacao.png)
