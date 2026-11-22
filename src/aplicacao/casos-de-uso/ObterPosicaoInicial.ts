import { Referencia, type Canon } from '../../dominio/biblia';
import type { PreferenciasRepository } from '../portas';

/** UC01 passo 2: capítulo da última posição de leitura, ou Gênesis 1 na primeira execução. */
export class ObterPosicaoInicial {
  constructor(
    private readonly canon: Canon,
    private readonly preferencias: PreferenciasRepository,
  ) {}

  async executar(): Promise<Referencia> {
    const prefs = await this.preferencias.obter();
    return prefs?.ultimaPosicao ?? primeiroCapitulo(this.canon);
  }
}

export function primeiroCapitulo(canon: Canon): Referencia {
  const [genesis] = canon.livros();
  if (!genesis) throw new Error('Cânon vazio.');
  return Referencia.capitulo(genesis, 1);
}
