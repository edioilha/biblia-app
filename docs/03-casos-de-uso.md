# 03 — Casos de Uso

## 1. Atores

| Ator | Tipo | Descrição |
|---|---|---|
| **Leitor** | Primário | Usuário final do app |
| **Repositório biblia.data** | Secundário (sistema externo) | Fornece os arquivos JSON das traduções para instalação |
| **Relógio do sistema** | Secundário | Data atual, usada pelos planos de leitura |

## 2. Diagrama de Casos de Uso

> Mermaid não possui sintaxe nativa de casos de uso; a notação abaixo é equivalente (atores à esquerda/direita, casos de uso como elipses, `<<include>>`/`<<extend>>` nas setas).

```mermaid
flowchart LR
    leitor(["👤 Leitor"])
    repo(["🗄️ Repositório<br/>biblia.data"])
    relogio(["🕒 Relógio"])

    subgraph sistema["Bíblia App"]
        direction TB
        UC01(("UC01<br/>Ler capítulo"))
        UC02(("UC02<br/>Ir para referência"))
        UC03(("UC03<br/>Buscar texto"))
        UC04(("UC04<br/>Gerenciar favoritos"))
        UC05(("UC05<br/>Marcar texto"))
        UC06(("UC06<br/>Gerenciar anotações"))
        UC07(("UC07<br/>Iniciar plano de leitura"))
        UC08(("UC08<br/>Acompanhar plano"))
        UC09(("UC09<br/>Instalar versão"))
        UC10(("UC10<br/>Trocar versão"))
        UC11(("UC11<br/>Exportar / importar backup"))
        UC12(("UC12<br/>Configurar leitura"))
        UC13(("UC13<br/>Consultar Meus Estudos"))
        UCI(("Indexar versão"))
    end

    leitor --- UC01 & UC02 & UC03 & UC04 & UC05 & UC06
    leitor --- UC07 & UC08 & UC09 & UC10 & UC11 & UC12 & UC13

    UC02 -. "«extend»" .-> UC01
    UC05 -. "«extend»" .-> UC01
    UC06 -. "«extend»" .-> UC01
    UC09 -. "«include»" .-> UCI
    UC03 -. "«include»" .-> UCI
    UC04 -. "«extend»" .-> UC13
    UC06 -. "«extend»" .-> UC13

    UC09 --- repo
    UC08 --- relogio
```

## 3. Lista de Casos de Uso

| ID | Caso de uso | Requisitos | Prior. |
|---|---|---|---|
| UC01 | Ler capítulo | RF01.1–RF01.6 | M |
| UC02 | Ir para referência | RF01.4 | M |
| UC03 | Buscar texto | RF02.x | M |
| UC04 | Gerenciar favoritos | RF03.x | M |
| UC05 | Marcar texto | RF04.x | M |
| UC06 | Gerenciar anotações | RF05.x | M |
| UC07 | Iniciar plano de leitura | RF06.1–RF06.2 | M |
| UC08 | Acompanhar plano | RF06.3–RF06.5 | M |
| UC09 | Instalar versão | RF07.3 | M |
| UC10 | Trocar versão | RF07.4, RF07.5 | M |
| UC11 | Exportar / importar backup | RF08.x | M |
| UC12 | Configurar leitura | RF01.7, BL-01, BL-02, BL-03 | S |
| UC13 | Consultar Meus Estudos | RF09.x, RF03.2, RF04.6, RF05.6 | M |

## 4. Especificações

### UC01 — Ler capítulo

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | Ao menos uma versão instalada |
| Pós-condição | Capítulo exibido; última posição salva |

**Fluxo principal**
1. Leitor abre o app.
2. Sistema exibe o capítulo da **última posição** (ou Gênesis 1 na primeira execução) na versão ativa.
3. Sistema renderiza o texto em página de papel e aplica **destaques**, **marcadores de anotação** e **favoritos** daquele capítulo.
4. Leitor navega para o próximo/anterior (botão, tecla ← →, swipe).
5. Sistema exibe o novo capítulo (passo 3) e salva a posição.

**Fluxos alternativos**
- **A1 — Escolher livro/capítulo:** no passo 4, leitor abre o seletor, escolhe livro e capítulo; volta ao passo 3.
- **A2 — Limite do cânon:** em Apocalipse 22 → próximo, botão fica desabilitado (idem Gênesis 1 → anterior).

---

### UC03 — Buscar texto

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | Versão ativa indexada |
| Pós-condição | Resultados exibidos (nenhum estado alterado) |

**Fluxo principal**
1. Leitor abre **Buscar** (barra superior) e digita o termo.
2. Após 250 ms sem digitação (*debounce*), sistema executa a busca na versão ativa, ignorando acentos e maiúsculas. O modo padrão é **Todas as palavras**; a **última palavra vale como prefixo** a partir de 3 letras ("amo" encontra "amor", "amou"), para a busca funcionar enquanto se digita.
3. Sistema exibe a 1ª página (20 itens) com referência, texto com os termos encontrados em negrito sublinhado e o total de **versículos** encontrados ("152 versículos encontrados · página 1 de 8", anunciado ao leitor de tela).
4. Leitor navega entre páginas (paginação numérica com primeira/última e reticências), muda a ordenação (relevância ou ordem bíblica) ou o tamanho da página (10, 20 ou 50).
5. Leitor clica em um resultado; sistema abre UC01 no capítulo, rolando até o versículo e destacando-o. **Voltar** retorna à mesma busca e página: o estado da busca fica na URL (`#/buscar?q=…&t=NT&p=2`), o que também permite compartilhar o link.

**Fluxos alternativos**
- **A1 — Frase exata:** termo entre aspas (ou o chip **Frase exata**) → só a sequência exata das palavras, ignorando a pontuação entre elas; a frase inteira é destacada. Escolher outro modo tira as aspas do termo.
- **A1b — Qualquer palavra:** chip **Qualquer palavra** → versículos com ao menos um dos termos.
- **A2 — Filtros:** chips **Toda a Bíblia / AT / NT** e o diálogo **Livros** (caixas de marcar por testamento) → sistema refaz a busca a partir da página 1. Escolher um testamento descarta os livros do outro.
- **A3 — Aproximada (fuzzy):** chip **≈ Aproximada**, desligado por padrão (só em palavras de 4+ letras). Sem resultados exatos, o sistema oferece **Buscar resultados aproximados**.
- **A4 — Sem resultados:** "Nenhum versículo encontrado para …" e sugestões conforme o caso: aproximada, buscar em toda a Bíblia (se há filtro), buscar as palavras em qualquer ordem (se frase exata).
- **A5 — Índice em preparo:** o índice é montado em segundo plano ao abrir o app; se o leitor buscar antes de ficar pronto, o sistema mostra "Preparando a busca…" e responde quando terminar.

**Regras:** termo mínimo de 2 letras ou números; resultados ordenados por relevância (padrão) ou ordem canônica.

**Fora desta fase:** buscar nas anotações (RF02.9) entra com Meus Estudos (UC13, 7.6); histórico de buscas (RF02.10) e seletor de intervalo de livros ficam no backlog (BL-08, BL-09).

---

### UC04 — Gerenciar favoritos

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | UC01 em execução |
| Pós-condição | Versículo marcado (ou desmarcado) como favorito; ★ atualizada na página |

**Fluxo principal**
1. Leitor toca/clica no **número do versículo** (ou o aciona pelo teclado).
2. Sistema abre a **barra de ações do versículo** (rodapé da tela), com o foco na primeira ação.
3. Leitor escolhe **☆ Favoritar**.
4. Sistema exibe a ★ antes do número na hora (atualização otimista), fecha a barra, devolve o foco ao número do versículo e anuncia "João 3:16 adicionado aos favoritos".
5. Sistema grava o favorito.

**Fluxos alternativos**
- **A1 — Desfavoritar:** no passo 3, se o versículo já é favorito, a ação é **★ Remover favorito**; sistema remove a ★ e o favorito.
- **A2 — Fechar sem ação:** leitor toca em ✕, pressiona Esc ou toca de novo no número; a barra fecha e o foco volta ao número. Trocar de capítulo também fecha a barra.
- **A3 — Falha ao gravar:** sistema desfaz a ★ e exibe aviso de erro.
- **A4 — Listar favoritos (RF03.2):** pela tela Meus Estudos (UC13, fase 7.6).

**Regras:** no máximo um favorito por versículo; favoritos valem para qualquer versão (pertencem à referência, não ao texto).

---

### UC05 — Marcar texto

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | UC01 em execução |
| Pós-condição | Destaque persistido e visível |

**Fluxo principal**
1. Leitor seleciona um trecho do texto (mouse, toque ou teclado), dentro de um versículo ou atravessando vários.
2. Sistema exibe a **barra de seleção** no rodapé da tela (desktop e celular, sem disputar espaço com o menu nativo de seleção): **Marcar** com as cores amarelo, verde, rosa e azul. A barra não rouba o foco, para o leitor continuar ajustando a seleção.
3. Leitor escolhe uma cor (amarelo é a primeira, RF04.3).
4. Sistema converte a seleção em `IntervaloTexto` (versículo + offset inicial → versículo + offset final) e **ajusta a palavras inteiras**: descarta espaços nas pontas e estende a ponta que cai no meio de uma palavra.
5. Sistema aplica a **regra de sobreposição** (A1, A2), grava o resultado de uma vez, limpa a seleção, renderiza o trecho como marca-texto translúcido e anuncia "Trecho marcado em amarelo".

**Fluxos alternativos**
- **A1 — Mesma cor:** a seleção sobrepõe um destaque da mesma cor, ou está separada dele **só por espaço** (inclusive na passagem entre versículos) → os destaques são **fundidos**. O resultado fica com o id e a data do mais antigo.
- **A2 — Outra cor (decisão da fase 7.3):** **o mais recente vence**. O destaque antigo é cortado no trecho sobreposto, dividido em dois se o novo cair no meio dele, ou removido se ficar coberto por inteiro. Assim os destaques de um capítulo **nunca se sobrepõem**.
- **A3 — Seleção fora do texto bíblico:** número de versículo, títulos e o espaço entre versículos não contam nos offsets; uma ponta fora do texto vai para o texto mais próximo dentro da seleção. Seleção sem texto bíblico não abre a barra.
- **A4 — Tocar num destaque:** leitor toca/clica no trecho marcado (sem selecionar) → sistema abre a **barra do destaque** (ex.: "João 3:16–17") com o foco nela: as quatro cores (a atual indicada), **Anotar** (UC06) e **Remover**.
  - **Trocar a cor** (RF04.5): segue a regra de sobreposição (pode fundir com vizinhos da nova cor).
  - **Remover** (RF04.4): exclui o destaque inteiro. Anotações vinculadas a ele passam a aparecer no versículo (UC06 A5).
  - Na **fusão** (A1), as anotações do destaque que deixa de existir passam para o que fica, na mesma transação.
- **A5 — Desmarcar trecho (borracha):** se a seleção cobre algum destaque, a barra de seleção mostra também **Desmarcar**, que tira exatamente o trecho selecionado (sem ajuste a palavras) de todos os destaques.
- **A6 — Pelo teclado:** a barra de ações do versículo (UC04) mostra **Remover marcação** quando o versículo tem marca-texto, e apaga a marcação só desse versículo. É o caminho acessível, pois o `<mark>` não recebe foco (virar botão atrapalharia a seleção de texto).
- **A7 — Cancelar:** ✕ ou Esc fecham a barra e desfazem a seleção.
- **A8 — Falha ao gravar:** sistema exibe aviso de erro e o texto fica como estava.

**Fora desta fase:** *Favoritar* fica no número do versículo (UC04). *Copiar* é o do próprio sistema. A listagem de destaques (RF04.6) fica em Meus Estudos (UC13, 7.6).

---

### UC06 — Gerenciar anotações

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | UC01 em execução |
| Pós-condição | Anotação persistida e visível na página |

**Fluxo principal**
1. Leitor escolhe **Anotar** na barra do versículo (UC04) ou na barra de um destaque (UC05 A4). Não há *Anotar* na barra de seleção: para anotar um trecho, ele é marcado antes.
2. Sistema abre o editor num diálogo modal (no celular, ocupa a parte de baixo da tela), com o foco no texto e a opção de exibição: **Rodapé** (padrão) ou **Inline**.
3. Leitor escreve a nota em Markdown básico (RF05.5: **negrito**, *itálico*, listas `-` e `1.`, parágrafos) e salva (botão ou Ctrl/⌘+Enter).
4. Sistema persiste, fecha o editor, devolve o foco ao número do versículo, anuncia "Nota salva em João 3:16" e renderiza:
   - **Rodapé:** marcador numerado (1, 2, … na ordem do capítulo) no fim do versículo, ou no fim do trecho quando a nota é de um destaque. As notas ficam no pé da página; o marcador leva até a nota, e a nota tem **Voltar ao texto** (↩) e **Editar nota**.
   - **Inline:** bloco logo abaixo do versículo, com **Editar nota**. O texto do capítulo é dividido em parágrafos nesse ponto.

**Fluxos alternativos**
- **A1 — Editar:** leitor escolhe **Editar nota** (rodapé ou bloco inline) → altera o texto e/ou o modo de exibição → salva (atualiza `atualizadoEm`).
- **A2 — Excluir:** no editor de uma nota existente, **Excluir** → o diálogo pede confirmação (**Excluir nota** / **Manter**) → remove e anuncia "Nota excluída".
- **A3 — Nota vazia:** **Salvar** fica desabilitado enquanto o texto só tem espaços.
- **A4 — Cancelar:** **Cancelar** ou Esc fecham sem gravar.
- **A5 — Destaque inexistente (leitura tolerante):** uma nota de destaque cujo destaque foi removido, ou que não existe na versão aberta (destaques são por versão; notas não), aparece no fim do versículo.
- **A6 — Falha ao gravar:** o erro aparece dentro do editor, que continua aberto com o texto.

**Regras (decisões da fase 7.4):** várias notas por versículo; as notas valem para qualquer versão; tamanho máximo de 10.000 caracteres; o Markdown é convertido em elementos React por um parser próprio (sem HTML do usuário).

---

### UC07 — Iniciar plano de leitura

| Campo | Descrição |
|---|---|
| Atores | Leitor, Relógio |
| Pré-condição | — |
| Pós-condição | Inscrição criada; o plano aparece em andamento na tela Planos |

**Fluxo principal**
1. Leitor abre **Planos**.
2. Sistema lista os planos pré-definidos ainda não iniciados (RF06.1), cada um com nome, descrição e média de capítulos por dia.
3. Leitor escolhe **Iniciar** num plano.
4. Sistema pede a **data de início**, com hoje como padrão, mostra quando o plano termina e pergunta por onde **começar** (A5); o padrão é o início do plano.
5. Leitor confirma; sistema cria a inscrição e passa a mostrar o plano em andamento (UC08).

**Fluxos alternativos**
- **A1 — Outra data:** o leitor escolhe uma data passada (para alinhar com uma leitura já começada) ou futura; antes do início, o plano mostra a primeira leitura e a data em que começa.
- **A2 — Vários planos:** o leitor pode seguir vários planos ao mesmo tempo, mas cada plano uma vez só; um plano em andamento sai da lista de disponíveis.
- **A3 — Recomeçar:** num plano concluído, **Começar de novo** abre o mesmo diálogo e cria uma inscrição nova (o progresso anterior é substituído).
- **A4 — Cancelar:** Cancelar ou Esc fecham sem iniciar.
- **A5 — Começar por outra leitura:** o leitor escolhe por onde começar, vendo a primeira leitura de cada opção:
  - **Início do plano** (padrão): dia 1 (Gênesis 1–3 na Bíblia em 1 ano).
  - **Leitura do calendário** (só planos de 365 dias): a leitura que corresponde à data de início no ano (1º/jan = dia 1; 29/fev usa a leitura de 28/fev). Ex.: começando em 24/11, lê 1 Coríntios 4–6, chega a Apocalipse em 31/dez e segue em Gênesis em 1º/jan.
  - **Um livro**: o primeiro dia do plano que lê esse livro (pode trazer o fim do livro anterior, como "Atos 27–28; Romanos 1").

  Em qualquer caso o plano tem a mesma duração e cobre todas as leituras; depois do último dia do plano, volta ao primeiro. O leitor sempre vê "dia 1, 2, 3…" contados a partir da sua data de início.

**Planos pré-definidos (decisão da fase 7.7):** Bíblia em 1 ano (365 dias), Novo Testamento em 90 dias e Salmos e Provérbios em 31 dias (dia n: Salmos n, n+30, n+60, n+90, n+120 e Provérbios n; dia 31: Provérbios 31). Os dois primeiros dividem os capítulos, em ordem, em partes quase iguais. Plano personalizado (RF06.6) fica no backlog (BL-13).

---

### UC08 — Acompanhar plano

| Campo | Descrição |
|---|---|
| Atores | Leitor, Relógio |
| Pré-condição | Plano iniciado (UC07) |
| Pós-condição | Progresso atualizado |

**Fluxo principal**
1. Leitor abre "Planos".
2. Sistema calcula o **dia atual** do plano (`hoje − dataInício + 1`, em dias do calendário local, limitado ao último dia) e exibe a leitura do dia, o progresso (%), os dias em atraso e a linha do tempo dos últimos 14 dias.
3. Leitor escolhe **Ler agora** e o sistema abre o primeiro capítulo da leitura (UC01).
4. Na leitura, uma **faixa do plano** aparece abaixo da barra superior sempre que o capítulo aberto faz parte da leitura de hoje (ou de um dia atrasado), com **Concluir dia N**.
5. Leitor conclui o dia (na faixa ou na tela Planos); sistema registra o dia como concluído.

**Fluxos alternativos**
- **A1 — Atrasado:** sistema lista os dias pendentes anteriores a hoje; o leitor pode concluí-los em qualquer ordem. A faixa da leitura usa o dia de hoje e, se o capítulo não for dele, o dia atrasado mais antigo que o contém.
- **A2 — Reagendar (RF06.5):** com dias em atraso, o leitor escolhe **Reagendar plano** e confirma → o **primeiro dia pendente passa a ser hoje** (nova data de início = hoje − (primeiro pendente − 1)). Os dias concluídos continuam concluídos.
- **A3 — Plano concluído:** todos os dias concluídos → o plano mostra "Plano concluído" e oferece **Começar de novo** (UC07 A3).
- **A4 — Desfazer:** o leitor desmarca um dia concluído por engano (**Desfazer** ou de novo na faixa).
- **A5 — Encerrar:** pelo menu do plano, **Encerrar plano** com confirmação apaga a inscrição e o progresso; o plano volta ao catálogo.

**Regras (decisões da fase 7.7):** o "dia" é o do calendário local do leitor, não 24 h corridas; a leitura do dia e os atrasos são recalculados ao voltar ao app; a regra de reagendar substitui a anterior ("hoje − dias concluídos consecutivos"), mais fácil de explicar na tela e igual a ela quando os dias concluídos são seguidos.

---

### UC09 — Instalar versão

| Campo | Descrição |
|---|---|
| Atores | Leitor, Repositório biblia.data |
| Pré-condição | Conexão com a internet |
| Pós-condição | Versão disponível offline e indexada |

**Fluxo principal**
1. Leitor abre **Versões**; sistema lista as versões instaladas e as disponíveis do catálogo (RF07.2).
2. Leitor escolhe **Instalar** em uma versão.
3. Sistema baixa os 66 livros (até 6 por vez), exibindo o progresso: etapa 1 de 3, "Baixando… 12 de 66 livros".
4. Sistema normaliza e valida cada livro (66 livros, total de capítulos, versículos em ordem) e importa tudo para o IndexedDB numa transação (etapa 2).
5. Sistema **indexa** a versão para a busca no Web Worker (etapa 3).
6. Sistema passa a versão para as instaladas e anuncia "… instalada". A instalação segue se o leitor sair da tela Versões.

**Fluxos alternativos**
- **A1 — Falha de rede:** sistema descarta o que baixou, mostra o erro e oferece **Tentar novamente**.
- **A2 — Dados inválidos:** sistema aborta, descarta e mostra que os arquivos vieram com problema.
- **A3 — Cancelar:** durante a instalação, **Cancelar** interrompe os downloads; nada fica instalado.

**Regras (decisões da fase 7.8):** o catálogo é fixo (ADR 0007): BLIVRE (embarcada), TB e ALM1911. A situação "instalando" ou "erro" só existe enquanto o app está aberto; instalada é a versão importada por completo. Falha na indexação também desfaz a importação.

---

### UC10 — Trocar versão

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | Versão instalada (UC09) |
| Pós-condição | Nova versão ativa; posição de leitura mantida |

**Fluxo principal**
1. Leitor abre **Versões** e escolhe outra versão instalada (botão de opção).
2. Sistema grava a nova versão ativa nas preferências, mantendo o capítulo da última leitura (RF07.4).
3. Leitura, busca e Meus Estudos passam a usar a versão ativa; a barra da leitura mostra a sigla.

**Fluxos alternativos**
- **A1 — Remover versão (RF07.5):** leitor escolhe **Remover** e confirma → sistema apaga o texto e o índice da versão. Se era a ativa, a padrão (BLIVRE) volta a ser a ativa.

**Regras (decisões da fase 7.8):**
- Favoritos e anotações valem para todas as versões (referência canônica). Destaques são da versão em que foram feitos; ao remover a versão, eles **ficam guardados** e voltam se ela for instalada de novo (o texto é o mesmo).
- A versão padrão (BLIVRE) não pode ser removida: vem com o app (seria importada de novo na próxima abertura) e garante que sempre resta uma versão instalada.
- A numeração difere pouco entre as versões (2Co 13:14 e Ap 12:18 só na BLIVRE; Jó 42:17 não existe na TB; Sl 46:3 falta na BLIVRE). Uma marcação num versículo que a versão ativa não tem fica guardada e aparece sem texto em Meus Estudos.
- Trocar de versão pela tela de leitura fica no backlog (BL-14).

---

### UC11 — Exportar / importar backup

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | — |
| Pós-condição | Exportar: arquivo JSON salvo pelo leitor. Importar: dados do arquivo juntados aos do aparelho |

**Fluxo principal (exportar — RF08.1)**
1. Leitor abre **Meus Estudos** e escolhe **Exportar backup**.
2. Sistema reúne favoritos, destaques (de todas as versões), anotações e planos seguidos e gera `biblia-app-backup-AAAA-MM-DD.json`.
3. O navegador baixa o arquivo; sistema anuncia quantos itens foram exportados.

**Fluxo principal (importar — RF08.2)**
1. Leitor escolhe **Importar backup** e seleciona um arquivo.
2. Sistema lê e valida o arquivo inteiro (cada item passa pelas regras do domínio).
3. Sistema mostra a prévia: data do backup e, por tipo, quantos itens são novos, atualizados ou já existiam — "nada do que você já tem é apagado".
4. Leitor confirma **Importar**; sistema junta os dados numa única transação e mostra o resumo. Listas e marcações na leitura são relidas.

**Fluxos alternativos**
- **A1 — Arquivo inválido:** não é JSON, não é do Bíblia App, não tem data, tem um item inválido ou passa de 20 MB → sistema explica e não grava nada.
- **A2 — Formato mais novo:** backup feito por uma versão mais nova do app → sistema pede para atualizar o app.
- **A3 — Cancelar:** na prévia, **Cancelar** fecha sem gravar.

**Regras (decisões da fase 7.9) — importar junta, não substitui:**
- **Favorito:** um por versículo; se o versículo já é favorito (ou o id já existe), fica o atual.
- **Anotação:** mesmo id → fica a editada por último (`atualizadoEm`); senão entra.
- **Destaque:** mesmo id → fica o atual; um destaque novo que se sobrepõe a outro da mesma versão e capítulo **não entra** (destaques nunca se sobrepõem) e é contado como ignorado.
- **Plano:** um por plano; se o leitor já segue o plano, fica a inscrição com mais dias concluídos (empate: a atual).
- Importar o mesmo arquivo de novo não duplica nada.
- As preferências (versão ativa, posição, tema, fonte) **não** entram no backup: são do aparelho. As versões instaladas também não (texto público, baixa-se de novo).
- O formato do arquivo está em [docs/06 §6.1](06-arquitetura.md).

---

### UC12 — Configurar leitura

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | — |
| Pós-condição | Tema, tamanho e família da fonte, tipo de folha e largura da página salvos nas preferências |

**Fluxo principal**
1. Na leitura, leitor toca no botão **Aa** da barra.
2. Sistema abre o painel com **Tamanho do texto** (A− / A+, 7 níveis, o 3º é o padrão), **Fonte** (Clássica, Moderna, Sem serifa, Legível), **Tema** (Claro, Sépia, Escuro), **Folha** (Lisa, Textura, Envelhecida, Pautada) e, em telas a partir de 768 px, **Largura da página** (Estreita, Média, Larga).
3. Cada mudança vale na hora e é salva; Esc ou tocar fora fecha o painel.

**Regras (decisões da fase 7.9):**
- O tema vale para o **app inteiro** (todas as telas); o tamanho, para o texto bíblico.
- O tema salvo é aplicado antes de a página aparecer (cópia no `localStorage`), para não piscar o claro ao abrir.
- Os três temas passam na verificação de contraste WCAG AA (axe) em todas as telas.

**Regras da largura da página (BL-01):**
- Três larguras fixas, sem controle livre: **Estreita** (672 px, a de sempre e o padrão), **Média** (768 px) e **Larga** (896 px). As margens internas crescem junto, para a linha não ficar longa demais.
- A opção só aparece a partir de 768 px (iPad em pé, notebook, desktop). No celular a página já ocupa a tela: a escolha feita em outra tela fica salva, mas não muda nada.
- Salva neste aparelho, como o tema e o tamanho (não entra no backup); aplicada antes de a página aparecer, para não pular de largura ao abrir.

**Regras da fonte (BL-02):**
- Quatro famílias para o título e o texto da página (cabeçalho, números dos versículos e notas continuam na fonte da interface): **Clássica** (a serifada de sempre e o padrão), **Moderna** (serifada de leitura em tela: Charter, Sitka ou Cambria, conforme o aparelho), **Sem serifa** (a do sistema) e **Legível** (Atkinson Hyperlegible, feita para baixa visão).
- Só a Legível é embarcada (licença OFL, peso 400, ~17 KB), para ser igual em todo aparelho e funcionar offline; as outras vêm do sistema e podem variar um pouco de um aparelho para outro.
- Cada opção do painel mostra uma amostra "Aa" na própria fonte.

**Regras da folha (BL-03):**
- Quatro tipos, em qualquer tema, só com CSS (sem imagens): **Textura** (a de sempre e o padrão: fibra sutil e vinheta), **Lisa** (sem textura), **Envelhecida** (vinheta mais forte, manchas e um tom quente; no escuro, manchas escuras) e **Pautada** (uma linha por linha de texto).
- Contraste WCAG AA garantido no pior ponto de cada folha: na Envelhecida, a tinta suave do cabeçalho (nos cantos) fica em ≥ 4,5:1 no claro e no sépia.
- Na Pautada, a altura da linha é arredondada para pixels inteiros, para a pauta não escorregar do texto em capítulos longos; as linhas recomeçam em cada parágrafo (notas inline não as desalinham).
- Cada opção do painel mostra uma amostra da folha no tema atual.
- Fonte e folha ficam salvas neste aparelho com o resto da configuração (não entram no backup) e são aplicadas antes de a página aparecer.

---

### UC13 — Consultar Meus Estudos

| Campo | Descrição |
|---|---|
| Ator | Leitor |
| Pré-condição | — |
| Pós-condição | Lista exibida; eventuais remoções/edições persistidas |

**Fluxo principal**
1. Leitor abre **Meus Estudos**.
2. Sistema exibe as abas **Favoritos**, **Destaques** e **Anotações** com o total de cada uma; a aba **Favoritos** vem selecionada.
3. Sistema lista os itens da aba (20 por página) em ordem bíblica, cada um com referência e trecho do texto (e a nota, na aba Anotações).
4. Leitor clica em um item; sistema abre UC01 no capítulo, rolando até o versículo.

**Fluxos alternativos**
- **A1 — Trocar aba:** sistema mantém filtro de texto/livro e volta à página 1.
- **A2 — Filtrar:** leitor digita texto ou escolhe livro → sistema refaz a lista a partir da página 1.
- **A3 — Ordenar por data:** sistema ordena do mais recente para o mais antigo.
- **A4 — Ações do item (⋮):** remover (com confirmação); editar nota (UC06); alterar cor do destaque (UC05).
- **A5 — Lista vazia:** sistema exibe orientação ("Selecione um texto na leitura para marcar…").

**Regras (decisões da fase 7.6):** os totais das abas seguem os filtros; o filtro de texto ignora acentos e maiúsculas e exige todas as palavras; na aba Anotações ele também procura na nota (é a busca nas anotações, RF02.9, com atalho na tela de busca); "mais recentes" usa a última edição das notas; destaques são os da versão exibida; o estado da tela fica na URL.
