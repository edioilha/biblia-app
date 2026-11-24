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
 * Tradução da Bíblia (ADR 0007: só domínio público). Metadados do catálogo; se está
 * instalada é dado do armazenamento, e o andamento de uma instalação (UC09) só existe
 * enquanto ela roda.
 */
export class Versao {
  constructor(
    readonly id: VersaoId,
    readonly nome: string,
    readonly ano: number,
    readonly licenca: string,
    readonly urlOrigem: string,
    /** A versão embarcada (RF07.1): vem com o app e é a ativa na primeira execução. */
    readonly padrao: boolean,
    /** Nota curta para o leitor (ex.: "ortografia antiga"). */
    readonly observacao = '',
    /** Tamanho aproximado do texto, em MB, para o leitor decidir se instala. */
    readonly tamanhoMb = 0,
  ) {}

  get sigla(): string {
    return this.id;
  }

  /**
   * RF07.5 — a versão padrão não pode ser removida: vem com o app (seria importada de novo
   * na próxima abertura) e garante que sempre resta uma versão instalada.
   */
  get removivel(): boolean {
    return !this.padrao;
  }
}
