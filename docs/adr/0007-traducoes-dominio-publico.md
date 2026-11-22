# 0007 — Somente traduções em domínio público

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
O repositório é público e o app será distribuído. O `biblia.data` contém 18 traduções; segundo o próprio projeto, apenas 3 são de domínio público e as demais "pertencem a suas editoras".

## Opções consideradas
1. **Distribuir somente as de domínio público**
2. Distribuir todas
3. Permitir que o usuário importe arquivos próprios

## Decisão
Opção **1**: **BLIVRE** (padrão, embarcada), **ALM1911** e **TB** (instaláveis). O catálogo de versões é uma lista explícita (allowlist) no código.

## Consequências
- ✅ Sem risco de violação de direitos autorais.
- ⚠️ Traduções populares (NVI, ARA, ACF, NAA) ficam de fora.
- 🔁 A opção 3 (importação pelo usuário de arquivos que ele tenha direito de usar) pode ser avaliada em ADR futura.
