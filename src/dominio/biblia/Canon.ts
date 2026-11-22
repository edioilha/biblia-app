import { ErroDominio } from '../compartilhado/ErroDominio';
import { chaveComAcentos, normalizarChave } from '../compartilhado/texto';
import { CodigoLivro } from './CodigoLivro';
import { DADOS_CANON } from './dados-canon';
import { Livro } from './Livro';
import { Referencia } from './Referencia';

export class LivroNaoEncontradoError extends ErroDominio {
  constructor(texto: string) {
    super(`Livro não encontrado: "${texto}".`);
  }
}

export class LivroAmbiguoError extends ErroDominio {
  constructor(
    texto: string,
    readonly candidatos: readonly Livro[],
  ) {
    super(`"${texto}" pode ser: ${candidatos.map((l) => l.nome).join(', ')}.`);
  }
}

/**
 * Domain service com os 66 livros do cânon (ordem protestante).
 * Resolve nomes/abreviações digitados pelo usuário e navega entre capítulos.
 */
export class Canon {
  private readonly lista: readonly Livro[];
  private readonly porCodigo: ReadonlyMap<string, Livro>;

  constructor() {
    this.lista = DADOS_CANON.map(
      ([codigo, nome, abreviacao, capitulos, testamento], i) =>
        new Livro(CodigoLivro.de(codigo), i + 1, nome, abreviacao, testamento, capitulos),
    );
    this.porCodigo = new Map(this.lista.map((l) => [l.codigo.valor, l]));
  }

  livros(): readonly Livro[] {
    return this.lista;
  }

  livro(codigo: CodigoLivro): Livro {
    const livro = this.porCodigo.get(codigo.valor);
    if (!livro) throw new LivroNaoEncontradoError(codigo.valor);
    return livro;
  }

  /**
   * Resolve o livro a partir do texto digitado, nesta ordem de prioridade:
   * 1. nome ou abreviação exatos, com acentos ("Jó" ≠ "Jo");
   * 2. nome ou abreviação sem acentos ("joao", "genesis");
   * 3. prefixo único do nome sem acentos ("apoc", "gene").
   */
  porNomeOuAbreviacao(texto: string): Livro {
    const comAcentos = chaveComAcentos(texto);
    const semAcentos = normalizarChave(texto);
    if (!semAcentos) throw new LivroNaoEncontradoError(texto);

    const exato = this.lista.filter(
      (l) => chaveComAcentos(l.abreviacao) === comAcentos || chaveComAcentos(l.nome) === comAcentos,
    );
    if (exato.length === 1 && exato[0]) return exato[0];

    const semAcento = this.lista.filter(
      (l) => normalizarChave(l.abreviacao) === semAcentos || normalizarChave(l.nome) === semAcentos,
    );
    if (semAcento.length === 1 && semAcento[0]) return semAcento[0];
    if (semAcento.length > 1) throw new LivroAmbiguoError(texto, semAcento);

    const prefixo = this.lista.filter((l) => normalizarChave(l.nome).startsWith(semAcentos));
    if (prefixo.length === 1 && prefixo[0]) return prefixo[0];
    if (prefixo.length > 1) throw new LivroAmbiguoError(texto, prefixo);

    throw new LivroNaoEncontradoError(texto);
  }

  /** Próximo capítulo (atravessa livros). `null` em Apocalipse 22. */
  proximo(ref: Referencia): Referencia | null {
    const livro = this.livro(ref.livro);
    if (ref.capitulo < livro.totalCapitulos) return Referencia.capitulo(livro, ref.capitulo + 1);
    const seguinte = this.lista[livro.ordem];
    return seguinte ? Referencia.capitulo(seguinte, 1) : null;
  }

  /** Capítulo anterior (atravessa livros). `null` em Gênesis 1. */
  anterior(ref: Referencia): Referencia | null {
    const livro = this.livro(ref.livro);
    if (ref.capitulo > 1) return Referencia.capitulo(livro, ref.capitulo - 1);
    const antecessor = this.lista[livro.ordem - 2];
    return antecessor ? Referencia.capitulo(antecessor, antecessor.totalCapitulos) : null;
  }
}
