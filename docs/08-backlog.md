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
| BL-05 | Persistência garantida do armazenamento (`navigator.storage.persist()`) | backup | ideia |
| BL-06 | Teste E2E de uso offline | RNF (PWA) | ideia |
| BL-07 | Modo foco de leitura | UC01, UC12 | ideia |

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

### BL-06 — Teste E2E de uso offline

- **Origem:** adiado da fase 7.1.
- **Ideia:** teste Playwright que instala o service worker, corta a rede e confirma que a leitura continua funcionando.

### BL-07 — Modo foco de leitura

- **Origem:** feedback após a fase 7.1.
- **Ideia:** modo de leitura sem distrações: esconde barra superior, botões de navegação e demais controles, deixando só a página de papel. Os controles reaparecem ao tocar/mover o mouse ou com uma tecla (ex.: `F` para entrar, `Esc` para sair). Pode combinar com tela cheia (Fullscreen API) e com BL-01/BL-03 (largura e folha próprias para o foco).
- **A decidir:** se o modo foco é um botão próprio ou um preset do UC12; manter navegação por teclado/swipe ativa enquanto os controles estão ocultos; acessibilidade (o controle de sair precisa ser sempre alcançável por teclado e leitor de tela).
