/** Implementações em memória das portas, para testes da aplicação e da UI. */
import type {
  AnotacaoRepository,
  DestaqueRepository,
  FavoritoRepository,
  FonteVersaoEmbarcada,
  GeradorId,
  LivroImportado,
  PreferenciasRepository,
  Relogio,
  TextoBiblicoRepository,
} from '../aplicacao/portas';
import { Canon, Capitulo, CodigoLivro, type Referencia, type VersaoId } from '../dominio/biblia';
import type {
  AlteracoesDestaques,
  Anotacao,
  AnotacaoId,
  Destaque,
  DestaqueId,
  Favorito,
  FavoritoId,
} from '../dominio/estudo';
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

export class FavoritosEmMemoria implements FavoritoRepository {
  readonly itens = new Map<FavoritoId, Favorito>();

  async porCapitulo(capitulo: Referencia): Promise<Favorito[]> {
    const chave = capitulo.doCapitulo().chave();
    return [...this.itens.values()].filter((f) => f.referencia.doCapitulo().chave() === chave);
  }

  async porReferencia(versiculo: Referencia): Promise<Favorito | null> {
    return [...this.itens.values()].find((f) => f.referencia.equals(versiculo)) ?? null;
  }

  async todos(): Promise<Favorito[]> {
    return [...this.itens.values()];
  }

  async salvar(favorito: Favorito): Promise<void> {
    this.itens.set(favorito.id, favorito);
  }

  async remover(id: FavoritoId): Promise<void> {
    this.itens.delete(id);
  }
}

export class AnotacoesEmMemoria implements AnotacaoRepository {
  readonly itens = new Map<AnotacaoId, Anotacao>();

  async porCapitulo(capitulo: Referencia): Promise<Anotacao[]> {
    const chave = capitulo.doCapitulo().chave();
    return [...this.itens.values()].filter((a) => a.referencia.doCapitulo().chave() === chave);
  }

  async todas(): Promise<Anotacao[]> {
    return [...this.itens.values()];
  }

  async porId(id: AnotacaoId): Promise<Anotacao | null> {
    return this.itens.get(id) ?? null;
  }

  async salvar(anotacao: Anotacao): Promise<void> {
    this.itens.set(anotacao.id, anotacao);
  }

  async remover(id: AnotacaoId): Promise<void> {
    this.itens.delete(id);
  }
}

export class DestaquesEmMemoria implements DestaqueRepository {
  readonly itens = new Map<DestaqueId, Destaque>();
  aplicacoes = 0;
  /** Para religar anotações nas fusões (como o adapter Dexie faz na mesma transação). */
  constructor(private readonly anotacoes?: AnotacoesEmMemoria) {}

  async porCapitulo(versao: VersaoId, capitulo: Referencia): Promise<Destaque[]> {
    const chave = capitulo.doCapitulo().chave();
    return [...this.itens.values()].filter(
      (d) => d.versaoId === versao && d.capitulo.chave() === chave,
    );
  }

  async daVersao(versao: VersaoId): Promise<Destaque[]> {
    return [...this.itens.values()].filter((d) => d.versaoId === versao);
  }

  async porId(id: DestaqueId): Promise<Destaque | null> {
    return this.itens.get(id) ?? null;
  }

  async aplicar({ salvar, remover, religar = [] }: AlteracoesDestaques): Promise<void> {
    this.aplicacoes++;
    for (const id of remover) this.itens.delete(id);
    for (const d of salvar) this.itens.set(d.id, d);
    for (const { de, para } of religar) {
      for (const a of this.anotacoes?.itens.values() ?? []) {
        if (a.destaqueId === de) this.anotacoes?.itens.set(a.id, a.comDestaque(para));
      }
    }
  }
}

export class RelogioFixo implements Relogio {
  constructor(public instante = new Date('2026-11-22T10:00:00Z')) {}
  agora(): Date {
    return new Date(this.instante);
  }
}

/** Gera UUIDs sequenciais previsíveis: ...0001, ...0002. */
export class GeradorIdSequencial implements GeradorId {
  constructor(private proximo = 1) {}
  novo(): string {
    return `00000000-0000-7000-8000-${String(this.proximo++).padStart(12, '0')}`;
  }
}
