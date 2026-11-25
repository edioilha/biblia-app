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
  /** UC12 (fase 7.9): "CLARO" | "SEPIA" | "ESCURO". Ausente em registros antigos: claro. */
  tema?: string;
  /** UC12: nível 1–7. Ausente em registros antigos: o padrão. */
  tamanhoFonte?: number;
  /** BL-01: "ESTREITA" | "MEDIA" | "LARGA". Ausente em registros antigos: estreita. */
  largura?: string;
}

/** Favorito (docs/06 §6). `chave` = "JHN.3.16" (índice único: um favorito por versículo). */
export interface FavoritoRegistro {
  id: string;
  chave: string;
  livro: string;
  capitulo: number;
  criadoEm: Date;
}

/** Posição no texto: [versículo, offset]. */
export type PosicaoRegistro = [versiculo: number, offset: number];

/**
 * Destaque (docs/06 §6). Dentro de um capítulo: `inicio`/`fim` guardam só versículo e offset.
 * `cor` = valor de CorDestaque ("AMARELO"…).
 */
export interface DestaqueRegistro {
  id: string;
  versaoId: string;
  livro: string;
  capitulo: number;
  inicio: PosicaoRegistro;
  fim: PosicaoRegistro;
  cor: string;
  criadoEm: Date;
}

/**
 * Anotação (docs/06 §6). `chave` = versículo ("JHN.3.16"); `destaqueId` = null quando a
 * nota é só do versículo (null não entra no índice). `exibicao` = "RODAPE" | "INLINE".
 */
export interface AnotacaoRegistro {
  id: string;
  chave: string;
  livro: string;
  capitulo: number;
  destaqueId: string | null;
  conteudo: string;
  exibicao: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Inscrição num plano de leitura (docs/06 §6). `planoId` tem índice único (um plano por
 * vez); `inicio` = "2026-11-24" (dia local); `diasConcluidos` em ordem crescente.
 */
export interface InscricaoRegistro {
  id: string;
  planoId: string;
  totalDias: number;
  inicio: string;
  diasConcluidos: number[];
  /** Leitura do plano pela qual começou (UC07 A5). Ausente em registros antigos: dia 1. */
  diaInicial?: number;
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
  destaques!: EntityTable<DestaqueRegistro, 'id'>;
  anotacoes!: EntityTable<AnotacaoRegistro, 'id'>;
  inscricoes!: EntityTable<InscricaoRegistro, 'id'>;

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
    // v3 (fase 7.3): destaques (marca-texto). Só cria a tabela.
    this.version(3).stores({
      destaques: 'id, [versaoId+livro+capitulo], criadoEm',
    });
    // v4 (fase 7.4): anotações. Só cria a tabela.
    this.version(4).stores({
      anotacoes: 'id, [livro+capitulo], atualizadoEm, destaqueId',
    });
    // v5 (fase 7.7): inscrições em planos de leitura. Só cria a tabela.
    this.version(5).stores({
      inscricoes: 'id, &planoId',
    });
  }
}
