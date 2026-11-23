/** Utilitários de teste para destaques: capítulo de exemplo e notação curta de intervalos. */
import { Canon, Capitulo, CodigoLivro, Referencia, VersaoId } from '../dominio/biblia';
import {
  Destaque,
  DestaqueId,
  IntervaloTexto,
  PosicaoTexto,
  type CorDestaque,
} from '../dominio/estudo';

export const canon = new Canon();
export const BLIVRE = VersaoId.de('BLIVRE');

/** Jo 3:1–3 com textos curtos e conhecidos (offsets fáceis de contar). */
export const TEXTOS_JO3: readonly (readonly [number, string])[] = [
  [1, 'aaa bbb ccc ddd'],
  [2, 'eee fff ggg'],
  [3, 'hhh iii'],
];

export function capituloJo3(textos = TEXTOS_JO3): Capitulo {
  return Capitulo.criar(BLIVRE, canon.livro(CodigoLivro.de('JHN')), 3, textos);
}

/** "1:4-2:3" → Jo 3:1 offset 4 até Jo 3:2 offset 3. */
export function intervalo(notacao: string, capitulo = 'Jo 3'): IntervaloTexto {
  const [a = '', b = ''] = notacao.split('-');
  const posicao = (p: string) => {
    const [v, o] = p.split(':').map(Number);
    return PosicaoTexto.em(Referencia.parse(`${capitulo}:${v}`, canon), o ?? 0);
  };
  return IntervaloTexto.criar(posicao(a), posicao(b));
}

export function notacao(i: IntervaloTexto): string {
  return `${i.inicio.numero}:${i.inicio.offset}-${i.fim.numero}:${i.fim.offset}`;
}

/** Id previsível: n = 1 → ...0001. */
export const idDestaque = (n: number) =>
  DestaqueId.de(`00000000-0000-7000-8000-${String(n).padStart(12, '0')}`);

export function destaque(
  n: number,
  notacaoIntervalo: string,
  cor: CorDestaque = 'AMARELO',
  criadoEm = new Date(Date.UTC(2026, 10, 22, 10, n)),
): Destaque {
  return Destaque.criar(idDestaque(n), BLIVRE, intervalo(notacaoIntervalo), cor, criadoEm);
}
