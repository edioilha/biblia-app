# 0002 — Stack: TypeScript + React + Vite

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
Aplicação web moderna, com boa documentação e suporte. O desenvolvedor tem experiência em PHP e busca uma linguagem atual.

## Opções consideradas
1. **TypeScript + React + Vite**
2. TypeScript + Vue + Vite
3. TypeScript + Svelte/SvelteKit
4. PHP (Laravel) + Blade/Livewire

## Decisão
Opção **1**, com:
- **TypeScript** em modo `strict`.
- **React 19** — maior ecossistema, documentação e mercado.
- **Vite** — build e dev server rápidos; plugin PWA maduro.
- **Tailwind CSS** — estilização utilitária; tema (claro/sépia/escuro) por variáveis CSS.
- **React Router** para rotas; **TanStack Query** para estado assíncrono; **Zustand** para estado de UI leve.
- **Vitest**, **Testing Library**, **Playwright** para testes; **ESLint** + **Prettier** para qualidade.

## Consequências
- ✅ Tipagem forte (familiar a quem usa PHP 8 com tipos).
- ✅ Ecossistema amplo; fácil encontrar soluções e bibliotecas.
- ⚠️ React exige disciplina de arquitetura — mitigado pela ADR 0006.
- ⚠️ Opção 4 (PHP) exigiria servidor, conflitando com a ADR 0003.
