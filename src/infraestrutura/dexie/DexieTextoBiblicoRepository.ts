import type { LivroImportado, TextoBiblicoRepository } from '../../aplicacao/portas';
import { Capitulo, type Canon, type Referencia, type VersaoId } from '../../dominio/biblia';
import type { BancoApp, CapituloRegistro } from './BancoApp';

export class DexieTextoBiblicoRepository implements TextoBiblicoRepository {
  constructor(
    private readonly db: BancoApp,
    private readonly canon: Canon,
  ) {}

  async obterCapitulo(versao: VersaoId, ref: Referencia): Promise<Capitulo | null> {
    const registro = await this.db.capitulos.get([versao, ref.livro.valor, ref.capitulo]);
    if (!registro) return null;
    return Capitulo.criar(versao, this.canon.livro(ref.livro), ref.capitulo, registro.versiculos);
  }

  async possuiVersao(versao: VersaoId): Promise<boolean> {
    return (await this.db.versoes.get(versao)) !== undefined;
  }

  async versoesInstaladas(): Promise<VersaoId[]> {
    return (await this.db.versoes.toCollection().primaryKeys()) as VersaoId[];
  }

  async importar(versao: VersaoId, livros: readonly LivroImportado[]): Promise<void> {
    const registros: CapituloRegistro[] = livros.flatMap((l) =>
      l.capitulos.map((versiculos, i) => ({
        versaoId: versao,
        livro: l.livro.valor,
        numero: i + 1,
        versiculos: versiculos.map(([n, t]) => [n, t]),
      })),
    );

    // Tudo ou nada: o registro em `versoes` só existe se todos os capítulos foram gravados.
    await this.db.transaction('rw', this.db.capitulos, this.db.versoes, async () => {
      await this.db.capitulos.where('versaoId').equals(versao).delete();
      await this.db.capitulos.bulkPut(registros);
      await this.db.versoes.put({ versaoId: versao, importadaEm: new Date() });
    });
  }

  async removerVersao(versao: VersaoId): Promise<void> {
    // O registro em `versoes` sai junto: sem ele, a versão não conta como instalada.
    await this.db.transaction('rw', this.db.capitulos, this.db.versoes, async () => {
      await this.db.capitulos.where('versaoId').equals(versao).delete();
      await this.db.versoes.delete(versao);
    });
  }
}
