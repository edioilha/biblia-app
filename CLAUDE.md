# CLAUDE.md

Guia rápido para agentes neste repositório. A fonte da verdade são os docs em `docs/`; aqui fica só o que se usa em toda sessão.

## O projeto

PWA offline-first para leitura e estudo da Bíblia: SPA cliente pura, sem backend; todos os dados ficam no IndexedDB do aparelho. Publicado no GitHub Pages em `/biblia-app/` (roteamento por hash, ADR 0009).

- **Situação:** v1.0.0 (MVP) entregue; o trabalho agora vem do [backlog](docs/08-backlog.md) (itens `BL-NN`). Ordem e status em [docs/09-roadmap.md](docs/09-roadmap.md).
- **Idioma:** código, identificadores, commits, PRs e docs em **português** ([ADR 0001](docs/adr/0001-idioma-dos-identificadores.md)); termos técnicos consagrados ficam em inglês.

## Ambiente

- **Node 26** (`.nvmrc`) via **fnm**. O padrão do fnm pode ser outra versão: confira `node -v` e use `fnm use` antes de rodar `npm`.
- Dois Macs (Intel e M4): as ferramentas podem estar em lugares diferentes. Em caso de dúvida, rode num shell de login (`zsh -lic '...'`).

## Comandos

```bash
npm run dev            # http://localhost:5173/biblia-app/
npm test               # Vitest (unitários + integração)
npm run test:coverage  # com cobertura (mínimo 80% em dominio/ e aplicacao/)
npm run test:e2e       # build + preview + Playwright (chromium, firefox, webkit)
npm run lint           # ESLint, com a regra de dependência entre camadas
npm run typecheck
npm run format:check
npm run build
```

O CI roda, nesta ordem: `npm ci → audit → format:check → lint → typecheck → test:coverage → build → e2e` (docs/07 §6). Antes de abrir um PR, rode tudo isso menos o e2e; o e2e, quando a mudança mexe em UI.

## Arquitetura (ADR 0006 · docs/06)

Hexagonal, em `src/`:

| Camada | Pode importar | Contém |
|---|---|---|
| `dominio/` | nada | value objects e entidades imutáveis, erros de domínio |
| `aplicacao/` | `dominio` | casos de uso (`casos-de-uso/`) e portas (`portas/`) |
| `infraestrutura/` | `dominio`, `aplicacao` | Dexie, MiniSearch (Web Worker + Comlink), fontes de versões, backup |
| `ui/` | todas (via `container.ts`) | React, rotas, TanStack Query, CSS (`ui/estilos/index.css`) |

O ESLint (`eslint-plugin-boundaries`) bloqueia importações fora dessa regra.

Convenções (docs/07 §5): TS `strict` com `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`; sem `any`; sem `!` fora de testes; erros de domínio como classes; arquivos de classe em `PascalCase.ts`, os demais em `kebab-case.ts`; testes ao lado do arquivo (`X.test.ts`).

Preferências de leitura (UC12): `dominio/preferencias/ConfiguracaoLeitura.ts`. São espelhadas no `localStorage` por `ui/tema.ts`, e `public/tema-inicial.js` as aplica antes do React, para o tema não piscar. Um campo novo nas preferências precisa passar por esses três lugares e pelo `DexiePreferenciasRepository`.

## Fluxo de trabalho

- GitHub Flow: branch curta `<tipo>/<descricao-kebab>` a partir da `main`; um PR por fase/item; **squash** para `feat`/`fix`.
- **Conventional Commits** em português, validados pelo commitlint (escopos: `biblia`, `estudo`, `planos`, `busca`, `versoes`, `ui`, `pwa`, `dexie`, `docs`, `leitura`…).
- Use o template de PR (`.github/pull_request_template.md`) e marque o checklist da Definition of Done (docs/07 §8).
- **Fora do escopo:** antes de incluir qualquer coisa além do que o item previa, principalmente o que se nota no uso, **pergunte**. Se entrar, destaque num alerta `> [!IMPORTANT]` no topo do PR, aplique a label `fora-do-escopo` e abra o resumo no chat com o bloco "⚠️ Mudanças fora do escopo".
- Ao entregar um item: atualize o status no backlog (docs/08) e os docs afetados (requisitos, UC, docs/06). Quando entregar uma fase, atualize também o roadmap (docs/09) e o progresso no README.
- **Segurança:** nunca descreva uma vulnerabilidade concreta em issue, PR ou backlog antes de corrigida; use *security advisory* privado (`SECURITY.md`). A CSP fica em `vite.config.ts` (só no build): recurso externo novo exige ajustá-la.
