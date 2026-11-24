# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem [SemVer](https://semver.org/lang/pt-BR/) (docs/07 §3).

## [1.0.0] — 2026-11-24 — MVP

Primeira versão completa: leitura e estudo da Bíblia no navegador, offline, sem conta e sem servidor — os dados ficam no aparelho.

### Leitura (UC01, UC02 — fase 7.1, #5)
- Versão **Bíblia Livre (BLIVRE)** embarcada e importada para o IndexedDB na primeira abertura; funciona offline (PWA).
- Página de papel, navegação por livro e capítulo (seletor de referência, setas e gesto), volta à última posição.

### Favoritos (UC04 — fase 7.2, #7)
- Favoritar e desfavoritar pelo número do versículo, também pelo teclado.

### Marca-texto (UC05 — fase 7.3, #8)
- Seleção ajustada a palavras inteiras, 4 cores, fusão de destaques da mesma cor e corte dos de outra cor, borracha.

### Anotações (UC06 — fase 7.4, #9)
- Notas em rodapé numerado ou inline, com Markdown básico; ligadas a um versículo ou a um destaque.

### Busca (UC03 — fase 7.5, #10)
- Busca dinâmica sem acentos, frase exata, aproximada, filtros por testamento e livro, paginação; índice em Web Worker.

### Meus Estudos (UC13 — fase 7.6, #11)
- Abas Favoritos, Destaques e Anotações com totais, filtro de texto e livro, ordem bíblica ou recentes, paginação e menu de ações.

### Planos de leitura (UC07, UC08 — fase 7.7, #13)
- Três planos (Bíblia em 1 ano, NT em 90 dias, Salmos e Provérbios em 31 dias); início pelo calendário ou por um livro; leitura do dia, atrasos, reagendar e faixa do plano na leitura.
- Navegação em *tab bar* no celular.

### Versões (UC09, UC10 — fase 7.8, #15)
- Instalar a **Tradução Brasileira (1917)** e a **Almeida 1911** (biblia.data), com progresso, cancelar e tentar de novo; trocar a versão ativa mantendo o capítulo; remover (a padrão fica).

### Backup e configurações (UC11, UC12 — fase 7.9, #16)
- Exportar backup em JSON; importar **juntando** aos dados do aparelho, com prévia e confirmação.
- Botão **Aa** na leitura: tamanho do texto (7 níveis) e temas claro, sépia e escuro no app inteiro.
- Pede armazenamento persistente ao navegador (BL-05).

### Qualidade
- Arquitetura hexagonal (ADR 0006) com regra de dependência verificada no lint.
- Testes unitários (Vitest) e E2E (Playwright) em Chromium, Firefox, WebKit e celular, com verificação de acessibilidade (axe, WCAG AA).

[1.0.0]: https://github.com/edioilha/biblia-app/releases/tag/v1.0.0
