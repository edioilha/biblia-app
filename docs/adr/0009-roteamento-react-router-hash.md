# 0009 — Roteamento com React Router em modo hash

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
A leitura precisa de endereços próprios por capítulo (link direto para `João 3:16`, botão voltar do navegador) e as próximas fases trazem novas telas (Buscar, Planos, Meus Estudos, Versões). O app é estático no GitHub Pages (ADR 0008), que não permite reescrever rotas profundas para o `index.html`: um `F5` em `/biblia-app/ler/JHN/3` resultaria em 404. O app também precisa abrir offline pelo service worker (ADR 0003).

## Opções consideradas
1. **React Router com `HashRouter`** (`/biblia-app/#/ler/JHN/3`)
2. React Router com `BrowserRouter` + truque do `404.html` que redireciona para o `index.html`
3. Router próprio mínimo sobre `location.hash`
4. Sem rotas (estado em memória + última posição)

## Decisão
Opção **1**. Rotas atuais:

| Rota | Tela |
|---|---|
| `#/` | Redireciona para a última posição de leitura (ou Gênesis 1) |
| `#/ler/:livro/:capitulo/:versiculo?` | Leitura (UC01); com versículo, rola e destaca (UC02). `livro` = código USFM (`JHN`) |
| qualquer outra | Redireciona para `#/` |

O roteador é montado em `main.tsx`; `App.tsx` declara apenas as rotas (nos testes usa-se `MemoryRouter`). Os caminhos são construídos por `ui/rotas.ts` (`caminhoLeitura`, `referenciaDaRota`) — nenhuma tela monta URLs à mão.

## Consequências
- ✅ Funciona no GitHub Pages e offline sem configuração de servidor; um único `index.html` no precache.
- ✅ Biblioteca padrão de mercado; suporta rotas aninhadas e *data APIs* se precisarmos depois.
- ⚠️ URLs com `#` são menos elegantes e o fragmento não chega ao servidor (irrelevante: não há backend).
- ⚠️ Dependência a mais no bundle (o JS total da fase 7.1 ficou em ~122 KB gzip, com React, Router e Dexie).
- 🔁 Migrar para `BrowserRouter` exige só trocar o roteador em `main.tsx` e tratar o 404 no Pages.
