# 01 — Documento de Visão

| Campo | Valor |
|---|---|
| Projeto | Bíblia App |
| Versão do documento | 0.1 (rascunho) |
| Data | 2026-11-21 |
| Responsável | Edio Ilha |
| Status | Em revisão |

## 1. Propósito

Construir uma aplicação **web, offline-first (PWA)**, para **leitura e estudo da Bíblia**, com experiência de leitura semelhante a um livro físico (página de papel), marca-texto, anotações visíveis na página, busca ampla e planos de leitura.

## 2. Problema

| O problema de | Afeta | Cujo impacto é | Uma solução de sucesso seria |
|---|---|---|---|
| Apps bíblicos com interface poluída, dependentes de internet, com marcações e anotações pouco naturais | Leitores e estudantes da Bíblia | Leitura fragmentada, estudo pouco produtivo, perda da sensação de "livro" | Leitura em página de papel, marcação como marca-texto real, notas junto ao texto, funcionando offline |

## 3. Posicionamento

Para **leitores e estudantes da Bíblia** que querem **ler e estudar de forma focada**, o **Bíblia App** é uma **aplicação web instalável e offline** que **reproduz a experiência do livro físico** com recursos digitais de busca, anotação e planos. Diferente de apps comerciais, é **open source, sem anúncios, sem conta obrigatória** e com dados **somente no dispositivo do usuário**.

## 4. Stakeholders e usuários

| Ator | Descrição |
|---|---|
| **Leitor** | Usuário final; lê, marca, anota, busca e segue planos de leitura. |
| **Mantenedor** | Desenvolvedor; publica versões do app e novas traduções. |
| **Fonte de dados** | Repositório [Projeto-Euaggelion/biblia.data](https://github.com/Projeto-Euaggelion/biblia.data) (JSON canônico por livro). |

## 5. Escopo

### 5.1 MVP (v1.0)

| ID | Funcionalidade |
|---|---|
| F01 | Navegação Livro → Capítulo → Versículo |
| F02 | Leitura de capítulo em layout de **página de livro/papel** |
| F03 | **Busca** ampla e dinâmica, com resultados **paginados** |
| F04 | **Favoritos** de versículos |
| F05 | **Marca-texto** (amarelo translúcido) sobre trechos de texto, inclusive entre versículos |
| F06 | **Anotações** junto ao versículo ou no rodapé da página, sempre visíveis |
| F07 | **Planos de leitura** (ex.: Bíblia em 1 ano) com acompanhamento de progresso |
| F08 | **Gestão de versões (traduções)**: versão padrão embarcada + instalação de outras |
| F09 | Funcionamento **100% offline** após a primeira carga (PWA instalável) |

### 5.2 Fora do escopo (v1.0)

- Conta de usuário, login e sincronização entre dispositivos
- Backend/servidor próprio
- Comparação lado a lado de traduções
- Compartilhamento social, áudio, comentários bíblicos, dicionários, mapas
- Traduções protegidas por direitos autorais

## 6. Traduções

Somente traduções em **domínio público** serão distribuídas (repositório público).

| Sigla | Nome | Papel no app |
|---|---|---|
| BLIVRE | Bíblia Livre (2018) | **Padrão** (embarcada) |
| ALM1911 | Almeida 1911 | Instalável |
| TB | Tradução Brasileira | Instalável |

A arquitetura deve permitir adicionar novas traduções no mesmo formato JSON canônico sem alterar código de domínio.

## 7. Restrições

| ID | Restrição |
|---|---|
| R01 | Aplicação web cliente (SPA/PWA), sem backend |
| R02 | Persistência local no navegador (IndexedDB) |
| R03 | Código público no GitHub (`edioilha/biblia-app`) |
| R04 | Apenas traduções de domínio público |
| R05 | Stack: TypeScript, React, Vite, Dexie.js, MiniSearch, Tailwind CSS |

## 8. Premissas e riscos

| Tipo | Descrição | Mitigação |
|---|---|---|
| Premissa | O formato JSON do `biblia.data` permanece estável | Camada de *adapter* de importação isolada; versionar o schema |
| Risco | Índice de busca grande demais para memória em dispositivos modestos | Índice por versão, construído em Web Worker e persistido |
| Risco | Usuário limpa dados do navegador e perde notas/destaques | Exportar/importar backup em JSON (requisito) + `navigator.storage.persist()` |
| Risco | Marcação entre versículos complexa na renderização | Modelar destaque por intervalo de offsets; testes unitários dedicados |

## 9. Critérios de sucesso

- Abrir qualquer capítulo em < 300 ms após instalado
- Busca retornando a primeira página de resultados em < 500 ms
- Funcionar em modo avião após a primeira visita
- Lighthouse: PWA ✓, Acessibilidade ≥ 90, Performance ≥ 90
- Cobertura de testes do domínio ≥ 80%
