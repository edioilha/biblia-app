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

/** Favorito (docs/06 §6). `chave` = "JHN.3.16" (índice único: um favorito por versículo). */
export interface FavoritoRegistro {
  id: string;
  chave: string;
  livro: string;
  capitulo: number;
  criadoEm: Date;
}

/**
 * Banco IndexedDB do app (ADR 0004). Cada mudança de schema = nova `version(n)`
 * com `upgrade()` quando houver migração de dados; nunca alterar versões publicadas.
 */
export class BancoApp extends Dexie {
  capitulos!: Table<CapituloRegistro, [versaoId: string, livro: string, numero: number]>;
  versoes!: EntityTable<VersaoRegistro, 'versaoId'>;
  preferencias!: EntityTable<PreferenciasRegistro, 'id'>;
  favoritos!: EntityTable<FavoritoRegistro, 'id'>;

  constructor(nome = 'biblia-app') {
    super(nome);
    this.version(1).stores({
      capitulos: '[versaoId+livro+numero], versaoId',
      versoes: 'versaoId',
      preferencias: 'id',
    });
    // v2 (fase 7.2): favoritos. Só cria a tabela; nenhum dado existente muda.
    this.version(2).stores({
      favoritos: 'id, &chave, [livro+capitulo], criadoEm',
    });
  }
}
