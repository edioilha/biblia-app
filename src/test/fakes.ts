/** Implementações em memória das portas, para testes da aplicação e da UI. */
import type {
  FonteVersaoEmbarcada,
  LivroImportado,
  PreferenciasRepository,
  TextoBiblicoRepository,
} from '../aplicacao/portas';
import { Canon, Capitulo, CodigoLivro, type Referencia, type VersaoId } from '../dominio/biblia';
import type { Preferencias } from '../dominio/preferencias';

export class TextoBiblicoEmMemoria implements TextoBiblicoRepository {
  readonly versoes = new Map<VersaoId, Map<string, LivroImportado>>();
  constructor(private readonly canon = new Canon()) {}

  async obterCapitulo(versao: VersaoId, ref: Referencia): Promise<Capitulo | null> {
    const versiculos = this.versoes.get(versao)?.get(ref.livro.valor)?.capitulos[ref.capitulo - 1];
    if (!versiculos) return null;
    return Capitulo.criar(versao, this.canon.livro(ref.livro), ref.capitulo, versiculos);
  }

  async possuiVersao(versao: VersaoId): Promise<boolean> {
    return this.versoes.has(versao);
  }

  async importar(versao: VersaoId, livros: readonly LivroImportado[]): Promise<void> {
    this.versoes.set(versao, new Map(livros.map((l) => [l.livro.valor, l])));
  }
}

export class PreferenciasEmMemoria implements PreferenciasRepository {
  salvamentos = 0;
  constructor(public atual: Preferencias | null = null) {}

  async obter(): Promise<Preferencias | null> {
    return this.atual;
  }

  async salvar(preferencias: Preferencias): Promise<void> {
    this.atual = preferencias;
    this.salvamentos++;
  }
}

/** Gera um livro sintético com o total de capítulos do cânon ("<LIVRO> <cap>:<v>"). */
export function livroSintetico(canon: Canon, codigo: string, versiculos = 3): LivroImportado {
  const livro = canon.livro(CodigoLivro.de(codigo));
  return {
    livro: livro.codigo,
    capitulos: Array.from({ length: livro.totalCapitulos }, (_, c) =>
      Array.from({ length: versiculos }, (_, v) => [v + 1, `${codigo} ${c + 1}:${v + 1}`] as const),
    ),
  };
}

export class FonteSintetica implements FonteVersaoEmbarcada {
  carregados = 0;
  constructor(private readonly canon = new Canon()) {}

  async carregarLivro(_versao: VersaoId, livro: CodigoLivro): Promise<LivroImportado> {
    this.carregados++;
    return livroSintetico(this.canon, livro.valor);
  }
}
