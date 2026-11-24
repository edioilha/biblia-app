# 08 — Backlog

Lista de ideias e melhorias **ainda não planejadas** em nenhuma fase. Um item sai daqui quando é discutido e entra numa fase do [Roadmap](09-roadmap.md) (vira requisito/caso de uso, PR e, se for o caso, ADR).

| Campo | Significado |
|---|---|
| **ID** | `BL-nn`, sequencial, nunca reaproveitado |
| **Origem** | De onde veio a ideia (fase, feedback, teste em dispositivo) |
| **Relação** | Requisitos/casos de uso já existentes que o item toca |
| **Status** | `ideia` → `em análise` → `planejado (fase X)` → `feito` / `descartado` |

## Resumo

| ID | Item | Relação | Status |
|---|---|---|---|
| BL-01 | Largura ajustável da área de leitura | RF01.6, UC12 | ideia |
| BL-02 | Tamanho e família da fonte | RF01.7, UC12 | ideia |
| BL-03 | Tipo de folha (tema da página) | RF01.6, RF01.7, UC12 | ideia |
| BL-04 | Aproveitar o espaço lateral no desktop | UC01, UC04, UC06 | ideia |
| BL-05 | Persistência garantida do armazenamento (`navigator.storage.persist()`) | backup | feito (fase 7.9) |
| BL-06 | Teste E2E de uso offline | RNF (PWA) | ideia |
| BL-07 | Modo foco de leitura | UC01, UC12 | ideia |
| BL-08 | Histórico das últimas buscas | RF02.10, UC03 | ideia |
| BL-09 | Filtro por intervalo de livros na busca | RF02.5, UC03 | ideia |
| BL-10 | Abas de Meus Estudos cabendo no celular | RNF03, UC13 | ideia |
| BL-11 | Wiki do projeto no GitHub | documentação | ideia |
| BL-12 | Monitorar acessos ao site publicado | RNF05, ADR 0008 | descartado |
| BL-13 | Plano de leitura personalizado | RF06.6, UC07 | ideia |
| BL-14 | Trocar de versão pela tela de leitura | RF07.4, UC10 | ideia |
| BL-15 | Importar tradução de um arquivo do usuário | RF07, ADR 0007 | ideia |
| BL-16 | Verificação de segurança em camadas | RNF, docs/07 §6 | em andamento |
| BL-17 | Migrar para TypeScript 7 e ESLint 10 | docs/07 (ferramentas) | ideia |

## Itens

### BL-01 — Largura ajustável da área de leitura

- **Origem:** feedback após a fase 7.1. No celular está ótima; em telas grandes (notebook/desktop) fica a sensação de sobrar espaço nas laterais.
- **Situação atual:** a página de papel tem largura máxima fixa de `max-w-2xl` (~672 px) em `src/ui/componentes/PaginaPapel.tsx`. A escolha foi intencional: linhas de ~60–75 caracteres são o ponto ótimo de legibilidade para texto corrido.
- **Ideia:** opção de largura *estreita / média / larga* (ex.: `2xl` / `3xl` / `4xl`), aumentando junto a fonte e as margens internas em telas grandes para manter o comprimento de linha confortável.
- **A decidir:** preset fixo ou controle livre; salvar por dispositivo (Preferências locais) ou global.

### BL-02 — Tamanho e família da fonte

- **Origem:** mesmo feedback; tamanho já previsto em RF01.7.
- **Ideia:** ajuste de tamanho (A− / A+, com limites) e escolha de família (ex.: serifada clássica, serifada moderna, sem serifa, fonte para dislexia).
- **A decidir:** quais fontes empacotar (impacto no tamanho do PWA/cache offline e licenças).
- **Fase 7.9:** o tamanho (A− / A+, 7 níveis) foi entregue com o UC12 (RF01.7); a escolha de família continua aqui.

### BL-03 — Tipo de folha (tema da página)

- **Origem:** mesmo feedback; temas claro/sépia/escuro já previstos em RF01.7.
- **Ideia:** além dos temas, variar o "papel": liso, com textura, envelhecido, pautado, modo noturno com baixo contraste.
- **A decidir:** quanto da textura vira imagem (peso) vs. CSS; contraste mínimo WCAG AA em todos os tipos.

### BL-04 — Aproveitar o espaço lateral no desktop

- **Origem:** derivado do BL-01.
- **Ideia:** em vez de (ou além de) alargar a página, usar as laterais em telas `lg+`:
  - painel lateral com anotações, favoritos ou referências do capítulo; ou
  - modo **livro aberto** (duas páginas lado a lado).
- **A decidir:** encaixar depois das fases de favoritos/anotações, quando já houver conteúdo para o painel.

### BL-05 — Persistência garantida do armazenamento

- **Origem:** adiado da fase 7.1.
- **Ideia:** chamar `navigator.storage.persist()` para reduzir o risco de o navegador apagar o IndexedDB.
- **Relação:** fase de backup/configurações.
- **Feito na fase 7.9:** ao abrir, se ainda não é persistente, o app chama `persist()` (ver docs/06 §6).

### BL-06 — Teste E2E de uso offline

- **Origem:** adiado da fase 7.1.
- **Ideia:** teste Playwright que instala o service worker, corta a rede e confirma que a leitura continua funcionando.

### BL-07 — Modo foco de leitura

- **Origem:** feedback após a fase 7.1.
- **Ideia:** modo de leitura sem distrações: esconde barra superior, botões de navegação e demais controles, deixando só a página de papel. Os controles reaparecem ao tocar/mover o mouse ou com uma tecla (ex.: `F` para entrar, `Esc` para sair). Pode combinar com tela cheia (Fullscreen API) e com BL-01/BL-03 (largura e folha próprias para o foco).
- **A decidir:** se o modo foco é um botão próprio ou um preset do UC12; manter navegação por teclado/swipe ativa enquanto os controles estão ocultos; acessibilidade (o controle de sair precisa ser sempre alcançável por teclado e leitor de tela).

### BL-08 — Histórico das últimas buscas

- **Origem:** RF02.10 (prioridade *Could*), adiado na fase 7.5.
- **Ideia:** mostrar as últimas buscas sob o campo quando ele está vazio (wireframe da busca), guardadas localmente.
- **A decidir:** quantas guardar, como apagar, se entram no backup (UC11).

### BL-09 — Filtro por intervalo de livros na busca

- **Origem:** RF02.5 ("intervalo de livros"), adiado na fase 7.5: marcar vários livros no diálogo cobre o uso.
- **Ideia:** atalho "de … até …" (ex.: Mateus a João) no diálogo de livros.

### BL-10 — Abas de Meus Estudos cabendo no celular

- **Origem:** revisão da fase 7.6. A linha das abas precisa de 375 px; numa tela de 393 px (iPhone 15) sobram só 361 px depois das margens, e a aba "Anotações" fica cortada uns 14 px. No iPhone a barra de rolagem lateral fica escondida até rolar, então o contador parece cortado sem aviso de que dá para rolar.
- **Medição (fase 7.6):** cabe no desktop (1280 px); rola para o lado em 393, 375, 360 e 320 px. Nunca há rolagem vertical (corrigido na 7.6).
- **Ideia:** no celular, diminuir o espaço interno das abas e entre elas (≈ 30 px a menos) para caber a partir de 375 px; abaixo disso, manter a rolagem lateral, talvez com um esmaecido na borda indicando que há mais.
- **Fase 7.7:** a navegação foi para a *tab bar* inferior no celular (a barra superior da leitura estourava a largura desde a 7.6), e o E2E `layout.spec.ts` confere que nenhuma tela fica mais larga que a janela. As abas de Meus Estudos continuam rolando para o lado dentro da própria linha.
- **Relação:** RNF03 (responsivo, mobile-first). Vale definir a **largura mínima suportada** (ex.: 360 px) e um teste E2E que confira que as abas e a navegação cabem nela.

### BL-11 — Wiki do projeto no GitHub

- **Origem:** pedido do mantenedor após a fase 7.6.
- **Situação:** a wiki está habilitada no repositório, mas ainda **sem nenhuma página** (2026-11-24).
- **Ideia:** usar a wiki para o que é do **leitor e de quem chega ao projeto**, deixando em `docs/` o que é de engenharia: guia de uso (ler, buscar, marcar, anotar, Meus Estudos, instalar como app, uso offline), perguntas frequentes, versões e licenças das traduções, e como contribuir.
- **A decidir:** o que fica só na wiki e o que fica em `docs/` (evitar conteúdo duplicado que desatualiza); se as páginas apontam para os docs ou os resumem; quem atualiza a wiki a cada fase (entrar no DoD, docs/07 §8?). A wiki é um repositório git à parte (`biblia-app.wiki.git`), sem PR nem CI.

### BL-12 — Monitorar acessos ao site publicado

- **Origem:** pedido do mantenedor após a fase 7.6.
- **Status:** **descartado** (2026-11-24).
- **Motivo:** o GitHub Pages (ADR 0008) não oferece estatísticas de acesso ao site; o *Insights → Traffic* conta só visitas ao repositório. Medir exigiria um serviço de terceiros carregado no navegador do leitor, o que contraria o RNF05 ("sem rastreamento"). Decisão do mantenedor: não implementar.

### BL-13 — Plano de leitura personalizado

- **Origem:** RF06.6 (prioridade *Could*), adiado na fase 7.7.
- **Ideia:** o leitor escolhe livros (ou um intervalo) e a duração em dias; o app divide os capítulos como nos planos pré-definidos (`dividir`).
- **A decidir:** onde guardar o plano criado (hoje os planos são gerados no código e a inscrição guarda só os números dos dias); edição depois de iniciado; se entra no backup.

### BL-14 — Trocar de versão pela tela de leitura

- **Origem:** discussão da fase 7.8 (fora do escopo; o wireframe prevê a troca só na tela Versões).
- **Ideia:** a sigla da versão ativa (ex.: "BLIVRE ▾") no topo da leitura abre a lista das versões instaladas para trocar sem sair do capítulo.
- **A decidir:** lugar na barra superior do celular, que já está cheia; se mostra só as instaladas.

### BL-15 — Importar tradução de um arquivo do usuário

- **Origem:** discussão da fase 7.8; é a opção 3 da [ADR 0007](adr/0007-traducoes-dominio-publico.md), deixada para avaliação futura.
- **Ideia:** o leitor carrega um arquivo (ou pasta/ZIP) no formato canônico do `biblia.data` com uma tradução que ele tenha direito de usar; o app valida e importa como as versões instaláveis.
- **A decidir:** nova ADR sobre licença e responsabilidade (o app não distribui o texto, só lê o arquivo do leitor); formato aceito (66 JSON, ZIP ou arquivo único); validação e mensagens de erro de arquivos de terceiros; se a tradução importada entra no backup.
- **Candidato para:** depois da v1.0.

### BL-16 — Verificação de segurança em camadas

- **Origem:** discussão após a v1.0.0.
- **Ideia:** proteger o projeto em camadas, da mais barata para a mais trabalhosa:
  1. **Dependabot** — alertas e PRs de atualização (npm e GitHub Actions).
  2. **CodeQL** — análise estática do código e dos workflows a cada PR e semanalmente.
  3. **`npm audit`** no CI — falha com vulnerabilidade alta ou crítica.
  4. **Content-Security-Policy** — limitar de onde o app carrega scripts e para onde se conecta.
  5. **Endurecer as Actions** — fixar por SHA e manter `permissions` mínimas.
  6. **Testes de entrada hostil** — arquivos importados com conteúdo malicioso ou grandes demais.
  7. **`SECURITY.md`** — canal privado para relatar vulnerabilidades.
- **Feito:** camadas 1, 2, 3 e 7 (só configuração), com o relato privado de vulnerabilidades e os alertas do Dependabot ligados no repositório.
- **Pendente:** camadas 4, 5 e 6 (mexem no app e no CI; cada uma com teste).
- **Regra:** uma vulnerabilidade concreta nunca é descrita em issue, PR ou neste backlog antes de corrigida; é tratada por *security advisory* privado (ver `SECURITY.md`).

### BL-17 — Migrar para TypeScript 7 e ESLint 10

- **Origem:** primeiros PRs do Dependabot (BL-16), em 2026-11-24: #20 (`@eslint/js` 10), #21 (`typescript` 7) e #22 (`eslint` 10).
- **Situação:** as versões major falharam no `npm ci` (`ERESOLVE`): o `typescript-eslint` ainda não aceita o TypeScript 7, e o `eslint-plugin-jsx-a11y` ainda não aceita o ESLint 10. Os três PRs foram fechados com `@dependabot ignore this major version`; as atualizações menores continuam chegando normalmente.
- **Ideia:** quando os plugins suportarem as novas versões, migrar numa tarefa planejada: TypeScript 7 sozinho; depois ESLint 10 junto com `@eslint/js` 10 e os plugins (`typescript-eslint`, `jsx-a11y`, `react-hooks`, `react-refresh`, `boundaries`), conferindo regras que mudaram.
- **Como acompanhar:** o Dependabot não reabre essas majors; checar de tempos em tempos os changelogs dos plugins ou rodar `npm outdated`.

