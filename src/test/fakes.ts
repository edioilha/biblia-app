/** Implementações em memória das portas, para testes da aplicação e da UI. */
import type {
  ArmazenamentoDadosLeitor,
  AnotacaoRepository,
  DestaqueRepository,
  FavoritoRepository,
  FonteVersao,
  GeradorId,
  InscricaoRepository,
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
import type { InscricaoId, InscricaoPlano, PlanoId } from '../dominio/planos';
import type { Preferencias } from '../dominio/preferencias';
import type { AlteracoesImportacao, DadosDoLeitor } from '../dominio/backup';

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

  async versoesInstaladas(): Promise<VersaoId[]> {
    return [...this.versoes.keys()];
  }

  async importar(versao: VersaoId, livros: readonly LivroImportado[]): Promise<void> {
    this.versoes.set(versao, new Map(livros.map((l) => [l.livro.valor, l])));
  }

  async removerVersao(versao: VersaoId): Promise<void> {
    this.versoes.delete(versao);
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

/**
 * Fonte com livros sintéticos. Com `prefixo`, o texto começa pela sigla da versão
 * ("TB JHN 3:16"), para distinguir versões nos testes. `segurar` deixa a carga pendente até
 * `liberar()` (para ver o progresso e cancelar); `falharEm` rejeita aquele livro.
 */
export class FonteSintetica implements FonteVersao {
  carregados = 0;
  private soltar: (() => void) | null = null;
  private bloqueio: Promise<void> = Promise.resolve();

  constructor(
    private readonly canon = new Canon(),
    private readonly opcoes: { prefixo?: boolean; falharEm?: string } = {},
  ) {}

  segurar(): void {
    this.bloqueio = new Promise((r) => {
      this.soltar = r;
    });
  }

  liberar(): void {
    this.soltar?.();
    this.bloqueio = Promise.resolve();
  }

  async carregarLivro(
    versao: VersaoId,
    livro: CodigoLivro,
    sinal?: AbortSignal,
  ): Promise<LivroImportado> {
    await this.bloqueio;
    sinal?.throwIfAborted();
    if (this.opcoes.falharEm === livro.valor) throw new Error(`Falha de rede em ${livro.valor}.`);
    this.carregados++;
    const l = livroSintetico(this.canon, livro.valor);
    if (!this.opcoes.prefixo) return l;
    return {
      ...l,
      capitulos: l.capitulos.map((c) => c.map(([n, t]) => [n, `${versao} ${t}`] as const)),
    };
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

export class InscricoesEmMemoria implements InscricaoRepository {
  readonly itens = new Map<InscricaoId, InscricaoPlano>();

  async todas(): Promise<InscricaoPlano[]> {
    return [...this.itens.values()];
  }

  async porId(id: InscricaoId): Promise<InscricaoPlano | null> {
    return this.itens.get(id) ?? null;
  }

  async porPlano(plano: PlanoId): Promise<InscricaoPlano | null> {
    return [...this.itens.values()].find((i) => i.planoId === plano) ?? null;
  }

  async salvar(inscricao: InscricaoPlano): Promise<void> {
    const outra = await this.porPlano(inscricao.planoId);
    if (outra && outra.id !== inscricao.id) throw new Error('Plano já tem inscrição.');
    this.itens.set(inscricao.id, inscricao);
  }

  async remover(id: InscricaoId): Promise<void> {
    this.itens.delete(id);
  }
}

/** Backup sobre os repositórios em memória (o que a tela vê é o que o backup lê e grava). */
export class DadosLeitorEmMemoria implements ArmazenamentoDadosLeitor {
  constructor(
    private readonly favoritos: FavoritosEmMemoria,
    private readonly destaques: DestaquesEmMemoria,
    private readonly anotacoes: AnotacoesEmMemoria,
    private readonly inscricoes: InscricoesEmMemoria,
  ) {}

  async ler(): Promise<DadosDoLeitor> {
    return {
      favoritos: [...this.favoritos.itens.values()],
      destaques: [...this.destaques.itens.values()],
      anotacoes: [...this.anotacoes.itens.values()],
      inscricoes: [...this.inscricoes.itens.values()],
    };
  }

  async aplicar(a: AlteracoesImportacao): Promise<void> {
    for (const id of a.inscricoesRemovidas) this.inscricoes.itens.delete(id);
    for (const f of a.favoritos) this.favoritos.itens.set(f.id, f);
    for (const d of a.destaques) this.destaques.itens.set(d.id, d);
    for (const n of a.anotacoes) this.anotacoes.itens.set(n.id, n);
    for (const i of a.inscricoes) this.inscricoes.itens.set(i.id, i);
  }
}
