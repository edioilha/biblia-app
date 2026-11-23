import { ErroDominio } from '../compartilhado/ErroDominio';

/** Cores do marca-texto (RF04.3, RF04.5). O valor é o mesmo gravado na persistência. */
export type CorDestaque = 'AMARELO' | 'VERDE' | 'ROSA' | 'AZUL';

export class CorDestaqueInvalidaError extends ErroDominio {
  constructor(valor: string) {
    super(`Cor de destaque inválida: "${valor}".`);
  }
}

/** Na ordem de exibição; a primeira é a padrão (amarelo, RF04.3). */
const CORES: readonly CorDestaque[] = ['AMARELO', 'VERDE', 'ROSA', 'AZUL'];

export const CorDestaque = {
  todas: CORES,
  padrao: 'AMARELO' as CorDestaque,
  de(valor: string): CorDestaque {
    const cor = CORES.find((c) => c === valor);
    if (!cor) throw new CorDestaqueInvalidaError(valor);
    return cor;
  },
};
