# 0006 — Arquitetura Hexagonal + DDD tático

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
O projeto deve seguir padrões profissionais, ser testável e permitir trocar tecnologias (armazenamento, busca, fonte de dados) sem reescrever regras de negócio.

## Opções consideradas
1. **Hexagonal (Ports & Adapters) + DDD tático**
2. Organização por feature, sem camadas (padrão comum em React)
3. MVC/MVVM tradicional

## Decisão
Opção **1**, camadas `dominio` → `aplicacao` → (`infraestrutura`, `ui`):
- Domínio puro em TypeScript, sem dependências de framework.
- Casos de uso como classes com método `executar()`.
- Portas (interfaces) na aplicação; adapters na infraestrutura.
- Composition Root manual (`src/container.ts`), sem framework de DI.
- Regra de dependência verificada no CI (`eslint-plugin-boundaries`).

## Consequências
- ✅ Domínio testável com repositórios em memória (rápido, sem navegador).
- ✅ Troca de Dexie/MiniSearch afeta só adapters.
- ⚠️ Mais arquivos e indireção que um app React típico — custo aceito pelo objetivo de aprendizado e manutenção.
