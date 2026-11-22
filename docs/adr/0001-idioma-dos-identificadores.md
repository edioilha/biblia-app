# 0001 — Idioma dos identificadores no código

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
A documentação e a linguagem ubíqua do domínio estão em português (`Versiculo`, `Anotacao`, `PlanoLeitura`). É preciso definir o idioma de classes, métodos, variáveis, arquivos e pastas.

## Opções consideradas
1. **Português nos conceitos de domínio**, inglês nos termos técnicos.
2. Tudo em inglês, com glossário de tradução na documentação.

## Decisão
Opção **1**:
- **Português**: conceitos do negócio — entidades, value objects, casos de uso, métodos de domínio, pastas de camadas (`dominio`, `aplicacao`, `infraestrutura`, `ui`).
- **Inglês**: sufixos e termos de padrão/tecnologia (`Repository`, `DTO`, `Page`, `use…` em hooks), APIs de bibliotecas e configurações.
- Sem acentos nem `ç` em identificadores (`Anotacao`, não `Anotação`).

Exemplo: `AnotacaoRepository`, `LeituraPage`, `useCapitulo`, `Destaque.fundirCom()`.

## Consequências
- ✅ Código espelha o diagrama de classes (`docs/04`) sem tradução mental.
- ✅ Alinhado à linguagem ubíqua (DDD).
- ⚠️ Mistura de idiomas nos nomes compostos — mitigado pela regra acima.
- ⚠️ Menos acessível a contribuidores que não falam português.
