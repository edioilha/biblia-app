import { Dexie, type EntityTable, type Table } from 'dexie';

/** Versículo persistido: [número, texto]. */
export type VersiculoRegistro = [numero: number, texto: string];

export interface CapituloRegistro {
  versaoId: string;
  livro: string;
  numero: number;
  versiculos: VersiculoRegistro[];
}

/** Presença do registro = versão importada por completo. */
export interface VersaoRegistro {
  versaoId: string;
  importadaEm: Date;
}

/** Registro único (id = "usuario"). Referências gravadas como chave ("JHN.3"). */
export interface PreferenciasRegistro {
  id: 'usuario';
  versaoAtiva: string;
  ultimaPosicao: string;
}

/**
 * Banco IndexedDB do app (ADR 0004). Cada mudança de schema = nova `version(n)`
 * com `upgrade()` quando houver migração de dados; nunca alterar versões publicadas.
 */
export class BancoApp extends Dexie {
  capitulos!: Table<CapituloRegistro, [versaoId: string, livro: string, numero: number]>;
  versoes!: EntityTable<VersaoRegistro, 'versaoId'>;
  preferencias!: EntityTable<PreferenciasRegistro, 'id'>;

  constructor(nome = 'biblia-app') {
    super(nome);
    this.version(1).stores({
      capitulos: '[versaoId+livro+numero], versaoId',
      versoes: 'versaoId',
      preferencias: 'id',
    });
  }
}
