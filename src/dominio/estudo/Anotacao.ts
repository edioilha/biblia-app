import type { Referencia } from '../biblia';
import { ErroDominio } from '../compartilhado/ErroDominio';
import { normalizarUuid } from '../compartilhado/uuid';
import type { DestaqueId } from './Destaque';

/** Identificador de uma anotação: UUID (v7, gerado no cliente — docs/04 §1). */
export type AnotacaoId = string & { readonly __marca: 'AnotacaoId' };

/** RF05.2 — onde a nota aparece na página. */
export type ModoExibicao = 'INLINE' | 'RODAPE';

export class AnotacaoIdInvalidoError extends ErroDominio {
  constructor(valor: string) {
    super(`Identificador de anotação inválido: "${valor}".`);
  }
}

export class AnotacaoInvalidaError extends ErroDominio {}

export const AnotacaoId = {
  de(valor: string): AnotacaoId {
    const id = normalizarUuid(valor);
    if (id === null) throw new AnotacaoIdInvalidoError(valor);
    return id as AnotacaoId;
  },
};

const MODOS: readonly ModoExibicao[] = ['RODAPE', 'INLINE'];

export const ModoExibicao = {
  todos: MODOS,
  /** UC06 passo 2: rodapé é o padrão. */
  padrao: 'RODAPE' as ModoExibicao,
  de(valor: string): ModoExibicao {
    const modo = MODOS.find((m) => m === valor);
    if (!modo) throw new AnotacaoInvalidaError(`Modo de exibição inválido: "${valor}".`);
    return modo;
  },
};

/** Limite generoso para uma nota de estudo (evita gravar textos acidentais enormes). */
export const TAMANHO_MAXIMO_ANOTACAO = 10_000;

/**
 * Nota do leitor sobre um versículo, opcionalmente ligada a um destaque (aggregate root,
 * RF05). Independente de versão: o destaque é só o ponto de ancoragem preferido; se ele não
 * existe (removido, ou em outra versão), a nota fica no versículo. Imutável.
 */
export class Anotacao {
  private constructor(
    readonly id: AnotacaoId,
    readonly referencia: Referencia,
    readonly destaqueId: DestaqueId | null,
    readonly conteudo: string,
    readonly exibicao: ModoExibicao,
    readonly criadoEm: Date,
    readonly atualizadoEm: Date,
  ) {}

  /** Cria uma anotação nova (`atualizadoEm = criadoEm`). */
  static nova(
    id: AnotacaoId,
    referencia: Referencia,
    destaqueId: DestaqueId | null,
    conteudo: string,
    exibicao: ModoExibicao,
    agora: Date,
  ): Anotacao {
    return Anotacao.reconstituir(id, referencia, destaqueId, conteudo, exibicao, agora, agora);
  }

  /** Reconstitui uma anotação persistida, validando as invariantes. */
  static reconstituir(
    id: AnotacaoId,
    referencia: Referencia,
    destaqueId: DestaqueId | null,
    conteudo: string,
    exibicao: ModoExibicao,
    criadoEm: Date,
    atualizadoEm: Date,
  ): Anotacao {
    if (referencia.versiculo === null) {
      throw new AnotacaoInvalidaError(
        `Anotação exige um versículo; "${referencia.chave()}" é um capítulo.`,
      );
    }
    if (Number.isNaN(criadoEm.getTime()) || Number.isNaN(atualizadoEm.getTime())) {
      throw new AnotacaoInvalidaError('Data da anotação inválida.');
    }
    if (atualizadoEm < criadoEm) {
      throw new AnotacaoInvalidaError('A anotação não pode ser atualizada antes de criada.');
    }
    return new Anotacao(
      id,
      referencia,
      destaqueId,
      Anotacao.validarConteudo(conteudo),
      exibicao,
      new Date(criadoEm),
      new Date(atualizadoEm),
    );
  }

  /** UC06 A3 — conteúdo sem espaços nas pontas, não vazio e dentro do limite. */
  static validarConteudo(conteudo: string): string {
    const limpo = conteudo.trim();
    if (!limpo) throw new AnotacaoInvalidaError('A nota não pode ficar vazia.');
    if (limpo.length > TAMANHO_MAXIMO_ANOTACAO) {
      throw new AnotacaoInvalidaError(
        `A nota passa do limite de ${TAMANHO_MAXIMO_ANOTACAO.toLocaleString('pt-BR')} caracteres.`,
      );
    }
    return limpo;
  }

  /** UC06 A1 — novo conteúdo e/ou modo; atualiza `atualizadoEm`. */
  editar(conteudo: string, exibicao: ModoExibicao, agora: Date): Anotacao {
    return Anotacao.reconstituir(
      this.id,
      this.referencia,
      this.destaqueId,
      conteudo,
      exibicao,
      this.criadoEm,
      agora < this.criadoEm ? this.criadoEm : agora,
    );
  }

  /** Passa a nota para outro destaque (fusão de destaques); não conta como edição. */
  comDestaque(destaqueId: DestaqueId | null): Anotacao {
    return new Anotacao(
      this.id,
      this.referencia,
      destaqueId,
      this.conteudo,
      this.exibicao,
      this.criadoEm,
      this.atualizadoEm,
    );
  }
}
