# 0008 — Hospedagem no GitHub Pages

| Campo | Valor |
|---|---|
| Status | Aceita |
| Data | 2026-11-22 |
| Decisores | Edio Ilha |

## Contexto
O app é estático (ADR 0003) e precisa de HTTPS (obrigatório para Service Worker). O código já está no GitHub.

## Opções consideradas
1. **GitHub Pages** com deploy por GitHub Actions
2. Netlify / Vercel / Cloudflare Pages
3. Apenas uso local (`npm run preview`)

## Decisão
Opção **1**: deploy automático a cada merge na `main` (workflow `deploy.yml`), URL `https://edioilha.github.io/biblia-app/`.

## Consequências
- ✅ Gratuito, HTTPS, integrado ao repositório e ao CI.
- ⚠️ Subcaminho `/biblia-app/` exige configurar `base` no Vite e escopo do Service Worker.
- ⚠️ Sem headers customizados (ex.: CSP) — aceitável para o MVP.
