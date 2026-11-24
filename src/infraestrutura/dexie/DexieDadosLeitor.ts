import type { ArmazenamentoDadosLeitor } from '../../aplicacao/portas';
import type { Canon } from '../../dominio/biblia';
import type { AlteracoesImportacao, DadosDoLeitor } from '../../dominio/backup';
import type { BancoApp } from './BancoApp';
import {
  anotacaoDeRegistro,
  anotacaoParaRegistro,
  destaqueDeRegistro,
  destaqueParaRegistro,
  favoritoDeRegistro,
  favoritoParaRegistro,
  inscricaoDeRegistro,
  inscricaoParaRegistro,
  ouNulo,
} from './mapeadores';

/** Backup (UC11): lê e grava os dados do leitor de uma vez, em transações. */
export class DexieDadosLeitor implements ArmazenamentoDadosLeitor {
  constructor(
    private readonly db: BancoApp,
    private readonly canon: Canon,
  ) {}

  private get tabelas() {
    return [this.db.favoritos, this.db.destaques, this.db.anotacoes, this.db.inscricoes];
  }

  async ler(): Promise<DadosDoLeitor> {
    return this.db.transaction('r', this.tabelas, async () => {
      const [favoritos, destaques, anotacoes, inscricoes] = await Promise.all([
        this.db.favoritos.toArray(),
        this.db.destaques.toArray(),
        this.db.anotacoes.toArray(),
        this.db.inscricoes.toArray(),
      ]);
      // Registros inválidos ficam de fora, como nos repositórios.
      return {
        favoritos: favoritos.flatMap((r) => ouNulo(() => favoritoDeRegistro(r, this.canon)) ?? []),
        destaques: destaques.flatMap((r) => ouNulo(() => destaqueDeRegistro(r, this.canon)) ?? []),
        anotacoes: anotacoes.flatMap((r) => ouNulo(() => anotacaoDeRegistro(r, this.canon)) ?? []),
        inscricoes: inscricoes.flatMap((r) => ouNulo(() => inscricaoDeRegistro(r)) ?? []),
      };
    });
  }

  async aplicar(a: AlteracoesImportacao): Promise<void> {
    await this.db.transaction('rw', this.tabelas, async () => {
      // Primeiro remove: a inscrição trocada tem o mesmo plano (índice único).
      await this.db.inscricoes.bulkDelete([...a.inscricoesRemovidas]);
      await this.db.favoritos.bulkPut(a.favoritos.map(favoritoParaRegistro));
      await this.db.destaques.bulkPut(a.destaques.map(destaqueParaRegistro));
      await this.db.anotacoes.bulkPut(a.anotacoes.map(anotacaoParaRegistro));
      await this.db.inscricoes.bulkPut(a.inscricoes.map(inscricaoParaRegistro));
    });
  }
}
