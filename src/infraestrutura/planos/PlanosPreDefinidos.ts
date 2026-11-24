import type { CatalogoPlanos } from '../../aplicacao/portas';
import { CodigoLivro, Referencia, Testamento, type Canon } from '../../dominio/biblia';
import { PlanoId, PlanoLeitura } from '../../dominio/planos';

/**
 * Catálogo dos planos pré-definidos (RF06.1). Os planos são gerados a partir do cânon,
 * de forma determinística: o mesmo dia tem sempre a mesma leitura, em qualquer aparelho.
 * Por isso uma inscrição guarda só os números dos dias concluídos.
 */
export class PlanosPreDefinidos implements CatalogoPlanos {
  private readonly planos: readonly PlanoLeitura[];

  constructor(canon: Canon) {
    const capitulos = (filtro: (codigo: string, testamento: Testamento) => boolean) =>
      canon
        .livros()
        .filter((l) => filtro(l.codigo.valor, l.testamento))
        .flatMap((l) =>
          Array.from({ length: l.totalCapitulos }, (_, i) => Referencia.capitulo(l, i + 1)),
        );
    const cap = (codigo: string, n: number) =>
      Referencia.capitulo(canon.livro(CodigoLivro.de(codigo)), n);

    this.planos = [
      PlanoLeitura.criar(
        PlanoId.de('biblia-1-ano'),
        'Bíblia em 1 ano',
        'Toda a Bíblia, de Gênesis a Apocalipse, em 365 dias.',
        dividir(
          capitulos(() => true),
          365,
        ),
      ),
      PlanoLeitura.criar(
        PlanoId.de('nt-90-dias'),
        'Novo Testamento em 90 dias',
        'De Mateus a Apocalipse em 90 dias.',
        dividir(
          capitulos((_, t) => t === Testamento.NOVO),
          90,
        ),
      ),
      PlanoLeitura.criar(
        PlanoId.de('salmos-proverbios-31-dias'),
        'Salmos e Provérbios em 31 dias',
        'Cinco salmos e um capítulo de Provérbios por dia; no dia 31, Provérbios 31.',
        // Dia n: Salmos n, n+30, n+60, n+90, n+120 e Provérbios n (150 salmos em 30 dias).
        Array.from({ length: 31 }, (_, i) => {
          const n = i + 1;
          const salmos = n <= 30 ? [0, 30, 60, 90, 120].map((d) => cap('PSA', n + d)) : [];
          return [...salmos, cap('PRO', n)];
        }),
      ),
    ];
  }

  async todos(): Promise<PlanoLeitura[]> {
    return [...this.planos];
  }

  async porId(id: PlanoId): Promise<PlanoLeitura | null> {
    return this.planos.find((p) => p.id === id) ?? null;
  }
}

/**
 * Divide os capítulos, em ordem, em `dias` partes quase iguais (diferença máxima de um
 * capítulo entre os dias).
 */
export function dividir<T>(itens: readonly T[], dias: number): T[][] {
  return Array.from({ length: dias }, (_, d) =>
    itens.slice(Math.floor((d * itens.length) / dias), Math.floor(((d + 1) * itens.length) / dias)),
  );
}
