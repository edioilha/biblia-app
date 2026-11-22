# 0004 — Persistência em IndexedDB via Dexie.js

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
Precisamos guardar no navegador ~31 mil versículos por versão, índices de busca e os dados do usuário, com consultas por capítulo rápidas (RNF02).

## Opções consideradas
1. **IndexedDB via Dexie.js**
2. SQLite-WASM com OPFS (inclui FTS5 para busca)
3. `localStorage`
4. IndexedDB puro (API nativa)

## Decisão
Opção **1**. Capítulo como unidade de armazenamento; índices compostos (`[versaoId+livro+numero]`); migrações versionadas do Dexie.

## Consequências
- ✅ API simples e tipada, transações, migrações, suporte em todos os navegadores.
- ✅ Leve (~30 KB) comparado ao SQLite-WASM (~1 MB).
- ⚠️ Sem SQL nem full-text nativo — busca resolvida pela ADR 0005.
- 🔁 Como o acesso é feito por portas (ADR 0006), migrar para SQLite-WASM no futuro afeta apenas a infraestrutura.
