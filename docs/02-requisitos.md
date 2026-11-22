# 02 — Requisitos

> Prioridade (MoSCoW): **M** = Must, **S** = Should, **C** = Could.

## 1. Requisitos Funcionais

### RF01 — Navegação e leitura

| ID | Requisito | Prior. |
|---|---|---|
| RF01.1 | Listar livros agrupados por Antigo e Novo Testamento | M |
| RF01.2 | Selecionar livro → capítulo e exibir o capítulo completo | M |
| RF01.3 | Navegar para capítulo anterior/próximo (botões, teclado ← →, gesto de swipe) | M |
| RF01.4 | Ir direto a uma referência digitada (ex.: `Jo 3:16`, `João 3`, `gn 1.1`) | M |
| RF01.5 | Lembrar a última posição de leitura e reabrir nela | M |
| RF01.6 | Página de leitura com aparência de **folha de papel/livro** (textura, margens, tipografia serifada, número do versículo sobrescrito) | M |
| RF01.7 | Ajustar tamanho da fonte e tema (claro, sépia, escuro) | S |

### RF02 — Busca

| ID | Requisito | Prior. |
|---|---|---|
| RF02.1 | Busca full-text em toda a versão ativa | M |
| RF02.2 | Ignorar acentos e maiúsculas/minúsculas (`coracao` encontra `coração`) | M |
| RF02.3 | Busca por **frase exata** (entre aspas) e por **todas/qualquer** das palavras | M |
| RF02.4 | Tolerância a erros de digitação (fuzzy) e busca por prefixo | S |
| RF02.5 | Filtros: testamento, livro(s), intervalo de livros | M |
| RF02.6 | Busca **dinâmica**: resultados atualizam enquanto digita (debounce) | M |
| RF02.7 | Resultados **paginados** (tamanho de página configurável, padrão 20) com total de ocorrências | M |
| RF02.8 | Termos encontrados destacados no resultado; clique abre o versículo no contexto | M |
| RF02.9 | Buscar também nas **anotações** do usuário | S |
| RF02.10 | Histórico das últimas buscas | C |

### RF03 — Favoritos

| ID | Requisito | Prior. |
|---|---|---|
| RF03.1 | Marcar/desmarcar versículo como favorito | M |
| RF03.2 | Listar favoritos, abrir no contexto, remover | M |

### RF04 — Marca-texto (Destaque)

| ID | Requisito | Prior. |
|---|---|---|
| RF04.1 | Selecionar trecho de texto com mouse/toque e aplicar marca-texto | M |
| RF04.2 | O destaque pode cobrir **parte** de um versículo ou **vários** versículos | M |
| RF04.3 | Aparência de **marca-texto amarelo translúcido** (efeito de caneta real) | M |
| RF04.4 | Remover destaque | M |
| RF04.5 | Outras cores (verde, rosa, azul) | C |
| RF04.6 | Listar todos os destaques | S |

### RF05 — Anotações

| ID | Requisito | Prior. |
|---|---|---|
| RF05.1 | Criar anotação vinculada a um versículo ou a um destaque | M |
| RF05.2 | Escolher exibição: **inline** (junto ao versículo) ou **rodapé** da página | M |
| RF05.3 | Anotações **sempre visíveis** na página de leitura (marcador numerado no texto ↔ nota) | M |
| RF05.4 | Editar e excluir anotação | M |
| RF05.5 | Formatação básica (negrito, itálico, listas — Markdown) | S |
| RF05.6 | Listar todas as anotações | S |

### RF06 — Planos de leitura

| ID | Requisito | Prior. |
|---|---|---|
| RF06.1 | Disponibilizar planos pré-definidos (ex.: Bíblia em 1 ano, NT em 90 dias) | M |
| RF06.2 | Iniciar plano com data de início | M |
| RF06.3 | Exibir leitura do dia e abrir diretamente | M |
| RF06.4 | Marcar leitura do dia como concluída; exibir progresso (%) e atrasos | M |
| RF06.5 | Recalcular/reagendar plano em caso de atraso | S |
| RF06.6 | Criar plano personalizado | C |

### RF07 — Versões (traduções)

| ID | Requisito | Prior. |
|---|---|---|
| RF07.1 | Versão padrão (BLIVRE) disponível na primeira execução | M |
| RF07.2 | Listar versões disponíveis e instaladas | M |
| RF07.3 | Instalar versão (download + importação + indexação), com progresso | M |
| RF07.4 | Trocar versão ativa mantendo a referência atual | M |
| RF07.5 | Remover versão instalada (exceto a última) | S |

### RF08 — Dados do usuário

| ID | Requisito | Prior. |
|---|---|---|
| RF08.1 | Exportar favoritos, destaques, anotações e planos em JSON | M |
| RF08.2 | Importar backup JSON | M |

> **Nota de domínio:** favoritos, destaques e anotações referenciam o versículo por **referência canônica** (`livro + capítulo + versículo`), independente da versão; assim permanecem válidos ao trocar de tradução. Destaques guardam também a versão e os offsets de caractere, pois o texto difere entre traduções.

## 2. Requisitos Não Funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Disponibilidade | 100% offline após primeira carga (Service Worker + IndexedDB) |
| RNF02 | Desempenho | Abrir capítulo < 300 ms; 1ª página de busca < 500 ms; indexação em Web Worker sem travar a UI |
| RNF03 | Usabilidade | Interface moderna, responsiva (desktop, tablet, celular), mobile-first |
| RNF04 | Acessibilidade | WCAG 2.1 AA; navegação por teclado; leitores de tela |
| RNF05 | Privacidade | Nenhum dado do usuário sai do dispositivo; sem rastreamento |
| RNF06 | Manutenibilidade | Clean/Hexagonal Architecture; domínio sem dependência de framework |
| RNF07 | Qualidade | Cobertura de testes do domínio ≥ 80%; lint e testes obrigatórios no CI |
| RNF08 | Portabilidade | Últimas 2 versões de Chrome, Safari, Firefox, Edge |
| RNF09 | Extensibilidade | Novas traduções no formato JSON canônico sem alterar código |
| RNF10 | Legal | Somente traduções de domínio público |
| RNF11 | Versionamento | SemVer, Conventional Commits, CHANGELOG |

## 3. User Stories (principais)

**US01 — Ler um capítulo**
Como leitor, quero abrir um capítulo em uma página que pareça papel, para ler com a sensação de um livro.
- *Dado* que estou em João 3, *quando* a página carrega, *então* vejo o texto em fonte serifada, sobre fundo de papel, com números de versículo sobrescritos.
- *Quando* pressiono →, *então* vou para João 4.

**US02 — Buscar**
Como leitor, quero buscar palavras ou frases e navegar pelos resultados paginados.
- *Dado* que digito `amor de deus`, *então* os resultados aparecem enquanto digito, com termos destacados, 20 por página, e o total de ocorrências.
- *Dado* que digito `"amor de Deus"` com aspas, *então* só aparecem versículos com a frase exata.
- *Dado* que filtro "Novo Testamento", *então* só aparecem resultados do NT.

**US03 — Marcar texto**
Como leitor, quero selecionar um trecho e marcá-lo em amarelo translúcido, como um marca-texto real.
- *Dado* que seleciono de "Porque Deus" (v.16) até "vida eterna" (v.16), *quando* escolho "Marcar", *então* apenas esse trecho fica destacado.
- *Dado* que seleciono do meio do v.16 até o meio do v.17, *então* o destaque cobre os dois versículos parcialmente.
- *Quando* reabro o capítulo, *então* o destaque persiste.

**US04 — Anotar**
Como leitor, quero escrever uma nota sobre um versículo e vê-la na própria página.
- *Dado* que crio nota em Jo 3:16 com exibição "rodapé", *então* aparece um marcador ¹ após o versículo e a nota no rodapé da página.
- *Dado* que escolho "inline", *então* a nota aparece logo abaixo do versículo.

**US05 — Seguir um plano**
Como leitor, quero seguir o plano "Bíblia em 1 ano" e ver meu progresso.
- *Dado* que iniciei o plano em 01/01, *quando* abro o app em 15/01, *então* vejo a leitura do dia 15 e quantos dias estou atrasado.
- *Quando* marco a leitura como concluída, *então* o progresso é atualizado.

**US06 — Instalar versão**
Como leitor, quero instalar a Almeida 1911 e alternar entre versões.
- *Quando* instalo a ALM1911, *então* vejo progresso de download/indexação e, ao final, posso selecioná-la.
- *Quando* troco de versão em Jo 3, *então* continuo em Jo 3 e meus favoritos e anotações continuam visíveis.

## 4. Rastreabilidade (Funcionalidade ↔ Requisitos)

| Funcionalidade | Requisitos |
|---|---|
| F01/F02 | RF01.x, RNF02, RNF03 |
| F03 | RF02.x, RNF02 |
| F04 | RF03.x |
| F05 | RF04.x |
| F06 | RF05.x |
| F07 | RF06.x |
| F08 | RF07.x, RNF09, RNF10 |
| F09 | RNF01 |
