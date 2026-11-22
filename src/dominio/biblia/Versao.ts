import { ErroDominio } from '../compartilhado/ErroDominio';

/** Identificador de uma versão (tradução): a própria sigla, ex.: "BLIVRE". */
export type VersaoId = string & { readonly __marca: 'VersaoId' };

export class VersaoIdInvalidoError extends ErroDominio {
  constructor(valor: string) {
    super(`Sigla de versão inválida: "${valor}".`);
  }
}

export const VersaoId = {
  /** Sigla em maiúsculas, letras e dígitos (ex.: BLIVRE, ALM1911, TB). */
  de(valor: string): VersaoId {
    const sigla = valor.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9]{1,15}$/u.test(sigla)) throw new VersaoIdInvalidoError(valor);
    return sigla as VersaoId;
  },
};

/**
 * Tradução da Bíblia. Nesta fase só a versão embarcada existe;
 * o ciclo de instalação (StatusInstalacao) entra com UC09.
 */
export class Versao {
  constructor(
    readonly id: VersaoId,
    readonly nome: string,
    readonly ano: number,
    readonly licenca: string,
    readonly urlOrigem: string,
    readonly padrao: boolean,
  ) {}

  get sigla(): string {
    return this.id;
  }
}
