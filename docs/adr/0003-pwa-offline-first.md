# 0003 — PWA offline-first, sem backend

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
O leitor deve usar o app sem internet (RNF01), sem conta (escopo do MVP) e com privacidade total (RNF05).

## Opções consideradas
1. **SPA + PWA, tudo no cliente**
2. SPA + API própria (Node/PHP) + banco no servidor
3. App nativo (Swift/Kotlin) ou híbrido (Flutter/React Native)

## Decisão
Opção **1**. Service Worker gerado pelo `vite-plugin-pwa` (Workbox) com pré-cache do build; a versão padrão (BLIVRE) é embarcada; instalável em desktop e celular.

## Consequências
- ✅ Funciona offline; zero custo de servidor; dados não saem do dispositivo.
- ✅ Um único código para desktop e celular.
- ⚠️ Sem sincronização entre dispositivos — mitigado por exportar/importar backup (RF08); sincronização fica para versão futura.
- ⚠️ Dados podem ser apagados pelo navegador — mitigado por `navigator.storage.persist()` e backup.
