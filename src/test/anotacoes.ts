/** Utilitário de teste para anotações. */
import { Referencia } from '../dominio/biblia';
import { Anotacao, AnotacaoId, type DestaqueId, type ModoExibicao } from '../dominio/estudo';
import { canon } from './destaques';

/** Id previsível: n = 1 → ...a001 (não colide com os ids de destaque do fixture). */
export const idAnotacao = (n: number) =>
  AnotacaoId.de(`00000000-0000-7000-8000-00000000a${String(n).padStart(3, '0')}`);

/** Anotação em `versiculo` ("Jo 3:16"); criada em 2026-11-22 11:0n. */
export function anotacao(
  n: number,
  versiculo: string,
  opcoes: { exibicao?: ModoExibicao; destaque?: DestaqueId; conteudo?: string } = {},
): Anotacao {
  return Anotacao.nova(
    idAnotacao(n),
    Referencia.parse(versiculo, canon),
    opcoes.destaque ?? null,
    opcoes.conteudo ?? `Nota ${n}`,
    opcoes.exibicao ?? 'RODAPE',
    new Date(Date.UTC(2026, 10, 22, 11, n)),
  );
}
