# 06 — Arquitetura

| Campo | Valor |
|---|---|
| Versão | 0.1 (rascunho) |
| Data | 2026-11-22 |
| Status | Em revisão |
| Decisões | [ADRs](adr/README.md) |

## 1. Visão geral

Aplicação **cliente pura** (SPA + PWA), sem backend. Todo o processamento e armazenamento acontece no navegador. A organização interna segue a **Arquitetura Hexagonal (Ports & Adapters)**: o domínio não conhece React, IndexedDB nem MiniSearch.

Diagramas no estilo **[C4 Model](https://c4model.com)** (Contexto → Containers → Componentes), desenhados com `flowchart` Mermaid.

## 2. C4 — Nível 1: Contexto

```mermaid
flowchart TB
    leitor["👤 <b>Leitor</b><br/><i>[Pessoa]</i><br/>Lê e estuda a Bíblia"]
    app["<b>Bíblia App</b><br/><i>[Sistema de software]</i><br/>PWA offline para leitura,<br/>marcação, anotação, busca e planos"]
    gh["<b>biblia.data</b><br/><i>[Sistema externo · GitHub]</i><br/>JSON canônico das traduções"]
    pages["<b>GitHub Pages</b><br/><i>[Sistema externo]</i><br/>Hospeda os arquivos estáticos do app"]

    leitor -- "Usa (navegador desktop/celular)" --> app
    app -- "Baixa traduções<br/>[HTTPS, JSON]" --> gh
    leitor -- "Primeiro acesso / atualizações<br/>[HTTPS]" --> pages
    pages -- "Entrega HTML/JS/CSS<br/>+ versão padrão (BLIVRE)" --> app

    classDef pessoa fill:#08427b,stroke:#052e56,color:#fff
    classDef sistema fill:#1168bd,stroke:#0b4884,color:#fff
    classDef externo fill:#999,stroke:#6b6b6b,color:#fff
    class leitor pessoa
    class app sistema
    class gh,pages externo
```

## 3. C4 — Nível 2: Containers

```mermaid
flowchart TB
    leitor["👤 <b>Leitor</b>"]

    subgraph browser["Navegador do usuário"]
        direction TB
        spa["<b>SPA</b><br/><i>[React + TypeScript]</i><br/>UI, casos de uso e domínio"]
        sw["<b>Service Worker</b><br/><i>[Workbox]</i><br/>Cache do app shell<br/>e funcionamento offline"]
        worker["<b>Search Worker</b><br/><i>[Web Worker + MiniSearch]</i><br/>Indexação e busca<br/>fora da thread de UI"]
        idb[("<b>IndexedDB</b><br/><i>[Dexie.js]</i><br/>Textos bíblicos, índices,<br/>dados do usuário")]
    end

    gh["<b>biblia.data</b><br/><i>[GitHub raw]</i>"]
    pages["<b>GitHub Pages</b>"]

    leitor -- "Interage" --> spa
    spa -- "Lê/grava<br/>[Dexie API]" --> idb
    spa -- "Consulta / indexa<br/>[postMessage · Comlink]" --> worker
    worker -- "Lê textos, persiste índice" --> idb
    spa -- "Baixa traduções<br/>[fetch]" --> gh
    sw -- "Pré-cache do build" --> pages
    spa -. "Requisições interceptadas" .-> sw

    classDef c fill:#438dd5,stroke:#2e6295,color:#fff
    classDef db fill:#438dd5,stroke:#2e6295,color:#fff
    classDef ext fill:#999,stroke:#6b6b6b,color:#fff
    classDef p fill:#08427b,stroke:#052e56,color:#fff
    class spa,sw,worker c
    class idb db
    class gh,pages ext
    class leitor p
```

| Container | Tecnologia | Responsabilidade |
|---|---|---|
| SPA | React 19, TypeScript, Vite, Tailwind | Interface, roteamento, casos de uso, domínio |
| Service Worker | `vite-plugin-pwa` (Workbox) | Pré-cache do app, offline, atualização da versão do app |
| Search Worker | Web Worker, MiniSearch, Comlink | Construção e consulta do índice full-text |
| IndexedDB | Dexie.js | Persistência local de todos os dados |

## 4. C4 — Nível 3: Componentes (SPA)

```mermaid
flowchart LR
    subgraph ui["UI — src/ui"]
        direction TB
        paginas["Páginas<br/><i>LeituraPage, BuscaPage,<br/>EstudosPage, PlanosPage,<br/>VersoesPage</i>"]
        comps["Componentes<br/><i>PaginaPapel, MarcaTexto,<br/>BarraSelecao, NotaRodape…</i>"]
        hooks["Hooks / estado<br/><i>TanStack Query, Zustand</i>"]
    end

    subgraph app["Aplicação — src/aplicacao"]
        direction TB
        uc["Casos de uso<br/><i>AbrirCapitulo, BuscarTexto,<br/>MarcarTexto, SalvarAnotacao,<br/>InstalarVersao…</i>"]
        portas["Portas (interfaces)<br/><i>*Repository, ServicoBusca,<br/>FonteVersoes, Relogio, GeradorId</i>"]
    end

    subgraph dom["Domínio — src/dominio"]
        direction TB
        ent["Entidades / Agregados<br/><i>Versao, Destaque, Anotacao,<br/>InscricaoPlano…</i>"]
        vo["Value Objects<br/><i>Referencia, IntervaloTexto,<br/>ConsultaBusca, Pagina</i>"]
    end

    subgraph infra["Infraestrutura — src/infraestrutura"]
        direction TB
        dexie["Dexie*Repository"]
        busca["MiniSearchServicoBusca<br/><i>(proxy p/ Search Worker)</i>"]
        fonte["GitHubBibliaDataFonte"]
        relogio["RelogioSistema<br/>GeradorUuidV7"]
    end

    comp_root["Composition Root<br/><i>src/main.tsx · container.ts</i>"]

    paginas --> comps
    paginas --> hooks
    hooks --> uc
    uc --> ent
    uc --> vo
    uc --> portas
    dexie -. "implementa" .-> portas
    busca -. "implementa" .-> portas
    fonte -. "implementa" .-> portas
    relogio -. "implementa" .-> portas
    comp_root --> dexie & busca & fonte & relogio
    comp_root --> uc
```

### Regra de dependência

```
ui  ──►  aplicacao  ──►  dominio
              ▲
infraestrutura ┘   (implementa as portas da aplicação)
```

- `dominio` **não importa nada** de outras camadas nem de bibliotecas de terceiros (exceto utilitários puros).
- `aplicacao` importa apenas `dominio`.
- `infraestrutura` importa `aplicacao` (portas) e `dominio`.
- `ui` importa `aplicacao` (casos de uso, DTOs) e `dominio` (tipos/value objects para exibição).
- A regra é **verificada automaticamente** no CI com `eslint-plugin-boundaries` (ou `dependency-cruiser`).
- A injeção de dependências é feita manualmente no **Composition Root** (sem framework de DI).

## 5. Diagramas de sequência

### 5.1 Abrir capítulo (UC01) e favoritar (UC04)

Texto e marcações são **duas leituras independentes** (decisão da fase 7.2): `AbrirCapitulo` lê o texto e salva a posição; `ObterMarcacoesDoCapitulo` lê favoritos, destaques e anotações. Uma alteração de marcação invalida só a consulta de marcações no cache do TanStack Query, sem reler o texto nem regravar a posição.

```mermaid
sequenceDiagram
    autonumber
    actor L as Leitor
    participant P as LeituraPage
    participant Q as TanStack Query
    participant UC as AbrirCapitulo
    participant M as ObterMarcacoesDoCapitulo
    participant AF as AlternarFavorito
    participant T as TextoBiblicoRepository
    participant F as FavoritoRepository
    participant PR as PreferenciasRepository

    L->>P: navega para João 3
    P->>Q: ['capitulo', 'JHN.3']
    Q->>UC: executar(Referencia JHN.3)
    UC->>T: obterCapitulo(BLIVRE, JHN.3)
    T-->>UC: Capitulo
    UC->>PR: salvar(ultimaPosicao = JHN.3)
    UC-->>P: CapituloAberto
    P->>Q: ['marcacoes', 'JHN.3']
    Q->>M: executar(JHN.3)
    M->>F: porCapitulo(JHN.3)
    F-->>M: Favorito[]
    Note over M: destaques e anotações<br/>entram em 7.3/7.4
    M-->>P: MarcacoesDoCapitulo
    P-->>L: página de papel com ★

    L->>P: número 16 → Favoritar
    P-->>L: ★ imediata (otimista)
    P->>AF: executar(JHN.3.16)
    AF->>F: porReferencia(JHN.3.16)
    F-->>AF: null
    AF->>F: salvar(Favorito)
    AF-->>P: true
    P->>Q: invalidar ['marcacoes', 'JHN.3']
    Q->>M: executar(JHN.3)
    M-->>P: MarcacoesDoCapitulo
    P-->>L: "João 3:16 adicionado aos favoritos"
```

**TanStack Query** (`src/ui/consultas/clienteConsultas.ts`): `networkMode: 'always'` (os dados são locais; o padrão pausaria consultas offline), `staleTime: Infinity` (só mudam pelas mutações, que invalidam o cache), sem *retry*. A consulta do capítulo usa `staleTime: 0`: ao voltar a um capítulo em cache, a página aparece na hora e `AbrirCapitulo` roda em segundo plano para registrar a posição.

### 5.2 Marcar texto (UC05)

```mermaid
sequenceDiagram
    autonumber
    actor L as Leitor
    participant C as PaginaPapel (UI)
    participant UC as MarcarTexto
    participant IT as IntervaloTexto
    participant D as DestaqueRepository

    L->>C: seleciona trecho (v.17 → v.18)
    C->>C: Selection API → nós DOM com data-ref + offsets
    C-->>L: exibe barra flutuante
    L->>C: clica "Marcar"
    C->>UC: executar(inicio, fim, AMARELO)
    UC->>IT: criar(inicio, fim) — valida invariantes
    UC->>D: porCapitulo(versão, livro, cap)
    D-->>UC: destaques existentes
    alt sobrepõe destaque da mesma cor
        UC->>UC: fundirCom() → novo intervalo
        UC->>D: remover(antigo)
    end
    UC->>D: salvar(Destaque)
    UC-->>C: Destaque
    C-->>L: trecho com marca-texto amarelo
```

### 5.3 Buscar texto (UC03)

```mermaid
sequenceDiagram
    autonumber
    actor L as Leitor
    participant P as BuscaPage
    participant UC as BuscarTexto
    participant S as MiniSearchServicoBusca
    participant W as Search Worker
    participant DB as IndexedDB

    L->>P: digita "amor de deus"
    P->>P: debounce 250 ms
    P->>UC: executar(ConsultaBusca.interpretar(entrada))
    UC->>S: buscar(BLIVRE, consulta)
    S->>W: postMessage(consulta)
    opt índice ainda não está em memória
        W->>DB: carregar índice serializado
        DB-->>W: JSON do índice
        W->>W: MiniSearch.loadJSON()
    end
    W->>W: search() + filtros + paginação
    W-->>S: Pagina<ResultadoBusca>
    S-->>UC: Pagina<ResultadoBusca>
    UC-->>P: Pagina<ResultadoBusca>
    P-->>L: 20 resultados + total + paginação
```

### 5.4 Instalar versão (UC09)

```mermaid
sequenceDiagram
    autonumber
    actor L as Leitor
    participant P as VersoesPage
    participant UC as InstalarVersao
    participant V as VersaoRepository
    participant F as GitHubBibliaDataFonte
    participant T as TextoBiblicoRepository
    participant S as ServicoBusca

    L->>P: clica "Instalar" (TB)
    P->>UC: executar(TB)
    UC->>V: salvar(status = INSTALANDO)
    UC->>F: baixar(TB, progresso)
    loop 66 livros (concorrência limitada)
        F->>F: fetch data/canonical/TB/<LIVRO>.json
        F-->>P: progresso (etapa 1/3)
    end
    F-->>UC: LivroImportado[] (normalizado)
    UC->>UC: validar (66 livros, capítulos > 0)
    UC->>T: importar(TB, livros) — transação única
    UC->>S: indexar(TB, progresso)
    S-->>P: progresso (etapa 3/3)
    UC->>V: salvar(status = INSTALADA)
    UC-->>P: ok
    P-->>L: "Tradução Brasileira instalada"

    alt falha em qualquer etapa
        UC->>T: removerVersao(TB)
        UC->>V: salvar(status = ERRO)
        UC-->>P: erro + "Tentar novamente"
    end
```

## 6. Persistência (IndexedDB / Dexie)

| Store | Chave primária | Índices | Conteúdo |
|---|---|---|---|
| `versoes` | `id` | `status` | Metadados de `Versao` |
| `capitulos` | `[versaoId+livro+numero]` | `versaoId` | `Capitulo` com array de versículos |
| `indices` | `versaoId` | — | Índice MiniSearch serializado (JSON) |
| `favoritos` | `id` | `&chave` (`JHN.3.16`), `[livro+capitulo]`, `criadoEm` | `Favorito` |
| `destaques` | `id` | `[versaoId+livro+capitulo]`, `criadoEm` | `Destaque` |
| `anotacoes` | `id` | `[livro+capitulo]`, `atualizadoEm` | `Anotacao` |
| `inscricoes` | `id` | `status` | `InscricaoPlano` |
| `preferencias` | `id` (`'usuario'`) | — | `Preferencias` |

- **Granularidade por capítulo**: abrir um capítulo = 1 leitura (atende RNF02 < 300 ms).
- **Migrações** versionadas com `db.version(n).stores(...).upgrade(...)`.
- **Persistência durável**: `navigator.storage.persist()` na primeira execução (previsto para a fase de backup).
- **Schema v1** (fase 7.1): `capitulos`, `versoes` (presença = versão importada por completo) e `preferencias`. Os demais stores entram em novas versões do schema.
- **Schema v2** (fase 7.2): `favoritos` (`id, &chave, [livro+capitulo], criadoEm`). Só cria a tabela; testado com migração a partir de um banco v1.
- Mapeamento entidade ↔ registro feito por **mappers** na infraestrutura (o domínio não conhece o formato de armazenamento).

## 7. Importação e normalização dos dados

### Versão embarcada (BLIVRE)

A BLIVRE é **pré-processada por script** e os arquivos gerados ficam **versionados** em `public/dados/BLIVRE/<LIVRO>.json` (entram no precache do PWA). O script roda manualmente, só quando a fonte muda — build e CI não dependem de rede:

```bash
npm run dados:blivre             # baixa do GitHub
npm run dados:blivre -- <dir>    # usa uma cópia local de data/canonical/BLIVRE
```

`scripts/dados/normalizar.ts` (funções puras, testadas) aplica a cada versículo:

1. normalização Unicode **NFC**;
2. remoção de markup de nota vazado (`/fn/…/*fn`, ex.: Dt 32:5);
3. `´` → `’` (`d´água`);
4. espaço após `, ; : . ! ? )` colado em letra (`destruição,diz`, `(Selá)Porque` — ~600 ocorrências);
5. `trim()` e colapso de espaços múltiplos (31 mil versículos tinham espaço final; 1,4 mil, espaço duplo).

E valida contra o cânon: código do livro, total de capítulos, capítulos sequenciais, versículos em ordem crescente e não vazios. A numeração dos versículos é **explícita** porque há lacunas (Sl 46 não tem o v. 3).

Formato embarcado (compacto, `capitulos[i]` = capítulo `i + 1`):

```json
{ "formato": 1, "livro": "JHN", "capitulos": [[[1, "No princípio era a Palavra, …"], [2, "…"]], …] }
```

Na primeira execução, `PrepararVersaoPadrao` carrega os 66 arquivos (`FonteEstatica`), valida e importa tudo numa **única transação** Dexie (tudo ou nada), com tela de progresso.

**Limitações conhecidas da fonte** (não corrigidas para não alterar o texto por heurística):
- algumas notas de tradução aparecem no corpo do versículo (ex.: 1Co 13:10 "…completo, Ou: perfeito…");
- Sl 46:3 está fundido ao v. 2.

### Versões instaláveis (UC09)

As demais versões serão baixadas sob demanda pelo adapter `GitHubBibliaDataFonte`, reutilizando a mesma normalização.

## 8. Estrutura de pastas

```
biblia-app/
├── .github/
│   ├── workflows/ci.yml          # lint, typecheck, testes, build
│   ├── workflows/deploy.yml      # GitHub Pages
│   └── pull_request_template.md
├── docs/                         # documentação (este diretório)
├── public/
│   └── dados/BLIVRE/             # versão embarcada (gerada por scripts/dados)
├── scripts/
│   └── dados/                    # preparar-blivre.ts, normalizar.ts
├── src/
│   ├── dominio/
│   │   ├── biblia/               # Versao, Livro, Capitulo, Referencia, Canon…
│   │   ├── estudo/               # Favorito, Destaque, Anotacao, IntervaloTexto…
│   │   ├── planos/               # PlanoLeitura, InscricaoPlano, Progresso…
│   │   ├── busca/                # ConsultaBusca, ResultadoBusca
│   │   ├── preferencias/
│   │   └── compartilhado/        # Pagina, Id, erros de domínio
│   ├── aplicacao/
│   │   ├── portas/               # *Repository, ServicoBusca, FonteVersoes, Relogio
│   │   └── casos-de-uso/         # AbrirCapitulo, BuscarTexto, …
│   ├── infraestrutura/
│   │   ├── dexie/                # BancoApp, Dexie*Repository
│   │   ├── busca/                # MiniSearchServicoBusca, busca.worker.ts
│   │   ├── fontes/               # FonteEstatica (embarcada), GitHubBibliaDataFonte
│   │   └── sistema/              # RelogioSistema
│   ├── ui/
│   │   ├── paginas/              # LeituraPage, BuscaPage, …
│   │   ├── componentes/          # PaginaPapel, MarcaTexto, …
│   │   ├── hooks/
│   │   ├── estilos/
│   │   └── rotas.ts              # caminhos das rotas (ADR 0009)
│   ├── container.ts              # Composition Root
│   └── main.tsx
├── tests/
│   ├── e2e/                      # Playwright
│   └── fixtures/
└── (testes unitários ficam ao lado do código: *.test.ts)
```

## 9. Estratégia de testes

| Nível | Ferramenta | Alvo | Meta |
|---|---|---|---|
| Unitário | Vitest | `dominio` e `aplicacao` (com repositórios em memória) | ≥ 80% de cobertura |
| Integração | Vitest + `fake-indexeddb` | Adapters Dexie e MiniSearch | Fluxos de persistência e busca |
| Componente | Testing Library | Componentes críticos (PaginaPapel, MarcaTexto) | Comportamento, acessibilidade |
| E2E | Playwright | Fluxos UC01, UC03, UC05, UC06, UC08, UC09 + offline | Caminhos principais |

## 10. Atributos de qualidade × decisões

| RNF | Como é atendido |
|---|---|
| RNF01 Offline | Service Worker (pré-cache) + IndexedDB + BLIVRE embarcada |
| RNF02 Desempenho | Capítulo como unidade de leitura; busca em Web Worker; índice persistido |
| RNF04 Acessibilidade | Componentes semânticos, foco visível, testes com `axe` no Playwright |
| RNF05 Privacidade | Sem backend, sem analytics; dados só no dispositivo |
| RNF06 Manutenibilidade | Hexagonal + regra de dependência verificada no CI |
| RNF07 Qualidade | CI obrigatório em PR: lint, typecheck, testes, cobertura |
| RNF09 Extensibilidade | Novas traduções = novo item no catálogo; sem alterar domínio |
