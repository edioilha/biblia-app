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

## Revisão (2026-11-22, fase 7.5) — índice em memória, sem persistir
Medido com a BLIVRE (31.102 versículos), em Node no desktop:

| Etapa | Tempo |
|---|---|
| Construir o índice (`addAll`) | ~334 ms |
| Serializar (`toJSON` + `stringify`) | ~150 ms (7 MB) |
| Carregar o JSON salvo (`loadJSON`) | ~93 ms |
| Uma busca ("deus", 4.033 resultados) | ~5 ms |

Os textos precisam ser lidos do IndexedDB de qualquer forma (exibição e frase exata). Persistir o índice pouparia só ~150–250 ms por sessão, em troca de 7 MB a mais por versão, de uma versão de formato e de lógica de invalidação. **Decisão revista:** o worker lê os capítulos da versão no IndexedDB e monta o índice **em memória**, em segundo plano, quando o app abre (`requestIdleCallback`); não há tabela `indices`. No navegador, a primeira busca logo após abrir o app leva ~1,3 s (com "Preparando a busca…") e as seguintes ~25–35 ms com a ida e volta ao worker.
- Normalização: `normalizarTermo` do domínio (minúsculas + remoção de diacríticos), compartilhada com o destaque dos termos.
- Prefixo só na última palavra (3+ letras); fuzzy opcional, só em palavras de 4+ letras.
