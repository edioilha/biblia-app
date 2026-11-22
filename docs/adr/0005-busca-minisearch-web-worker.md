# 0005 — Busca full-text com MiniSearch em Web Worker

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
A busca deve ser ampla e dinâmica (RF02): sem acentos, frase exata, todas/qualquer palavra, fuzzy, prefixo, filtros, paginação, < 500 ms (RNF02), sem travar a interface.

## Opções consideradas
1. **MiniSearch em Web Worker**
2. FlexSearch
3. Lunr.js
4. SQLite FTS5 (via SQLite-WASM)
5. Varredura linear com regex

## Decisão
Opção **1**:
- Um índice por versão (documento = versículo; campos: texto, livro, testamento).
- Normalização: minúsculas + remoção de diacríticos (NFD) no indexador e na consulta.
- Fuzzy e prefixo nativos; frase exata = busca de termos + verificação de adjacência no texto.
- Índice construído uma vez na instalação, serializado (`toJSON`) e persistido no IndexedDB; carregado sob demanda.
- Comunicação SPA ↔ Worker via **Comlink**.

## Consequências
- ✅ Biblioteca pequena (~7 KB), bem documentada, com fuzzy e prefixo.
- ✅ UI não trava durante indexação/busca.
- ⚠️ Frase exata exige pós-filtro — custo aceitável sobre o conjunto já filtrado.
- ⚠️ Índice ocupa memória (~10–20 MB por versão carregada) — apenas a versão ativa fica em memória.
