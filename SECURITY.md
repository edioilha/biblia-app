# Política de segurança

## Como relatar uma vulnerabilidade

**Não abra issue nem PR público** para relatar uma falha de segurança.

Use o relato privado do GitHub: **[Security → Report a vulnerability](https://github.com/edioilha/biblia-app/security/advisories/new)**. Só os mantenedores veem o relato.

Inclua, se possível:
- o que acontece e o impacto (ex.: um arquivo de backup que executa script no app);
- passos ou arquivo para reproduzir;
- navegador e sistema usados.

Você recebe uma resposta assim que o relato for analisado. A correção é feita em privado e a falha só é divulgada (em um *security advisory*) depois de corrigida, com crédito a quem relatou, se quiser.

## Versões cobertas

| Versão | Recebe correções de segurança |
|---|---|
| 1.x (a publicada no site) | ✅ |
| < 1.0 | ❌ |

## Contexto

O Bíblia App roda só no navegador: não há servidor, contas nem dados na nuvem — favoritos, destaques, anotações e planos ficam no aparelho do leitor. As entradas externas são os arquivos de backup importados pelo leitor e os textos das versões baixados do biblia.data.
