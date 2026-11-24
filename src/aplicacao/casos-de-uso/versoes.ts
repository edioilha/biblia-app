import type { Canon, Versao, VersaoId } from '../../dominio/biblia';
import { Preferencias } from '../../dominio/preferencias';
import { ErroAplicacao } from '../ErroAplicacao';
import type {
  CatalogoVersoes,
  FonteVersao,
  PreferenciasRepository,
  ServicoBusca,
  TextoBiblicoRepository,
} from '../portas';
import { carregarVersao } from './carregarVersao';
import { primeiroCapitulo } from './ObterPosicaoInicial';

export class VersaoForaDoCatalogoError extends ErroAplicacao {
  constructor(id: VersaoId) {
    super(`A versão ${id} não está no catálogo.`);
  }
}

export class VersaoNaoInstaladaError extends ErroAplicacao {
  constructor(versao: Versao) {
    super(`A versão ${versao.nome} não está instalada.`);
  }
}

export class VersaoNaoRemovivelError extends ErroAplicacao {
  constructor(versao: Versao) {
    super(`A versão ${versao.nome} vem com o app e não pode ser removida.`);
  }
}

function doCatalogo(catalogo: CatalogoVersoes, id: VersaoId): Versao {
  const versao = catalogo.porId(id);
  if (!versao) throw new VersaoForaDoCatalogoError(id);
  return versao;
}

/**
 * Versão em que o leitor lê, busca e marca (preferências). Sem preferência salva, ou se a
 * salva saiu do catálogo, é a padrão.
 */
export class ObterVersaoAtiva {
  constructor(
    private readonly catalogo: CatalogoVersoes,
    private readonly preferencias: PreferenciasRepository,
  ) {}

  async executar(): Promise<Versao> {
    const prefs = await this.preferencias.obter();
    return (prefs && this.catalogo.porId(prefs.versaoAtiva)) ?? this.catalogo.padrao();
  }
}

export interface ItemVersao {
  readonly versao: Versao;
  readonly instalada: boolean;
  readonly ativa: boolean;
}

/** RF07.2 — versões do catálogo com a situação de cada uma, na ordem do catálogo. */
export class ListarVersoes {
  constructor(
    private readonly catalogo: CatalogoVersoes,
    private readonly texto: TextoBiblicoRepository,
    private readonly versaoAtiva: ObterVersaoAtiva,
  ) {}

  async executar(): Promise<ItemVersao[]> {
    const [instaladas, ativa] = await Promise.all([
      this.texto.versoesInstaladas(),
      this.versaoAtiva.executar(),
    ]);
    return this.catalogo.todas().map((versao) => ({
      versao,
      instalada: instaladas.includes(versao.id),
      ativa: versao.id === ativa.id,
    }));
  }
}

export type EtapaInstalacao = 'BAIXANDO' | 'IMPORTANDO' | 'INDEXANDO';

export interface ProgressoInstalacao {
  readonly etapa: EtapaInstalacao;
  /** Livros baixados (só na etapa BAIXANDO; nas outras, igual ao total). */
  readonly concluidos: number;
  readonly total: number;
}

/** Downloads simultâneos do biblia.data. */
const CONCORRENCIA_DOWNLOAD = 6;

/**
 * UC09 — Instalar versão: baixa os 66 livros (com progresso), valida e importa numa
 * transação, e monta o índice da busca. Em falha ou cancelamento (A1/A2), nada fica pela
 * metade: o texto importado e o índice são descartados.
 */
export class InstalarVersao {
  constructor(
    private readonly canon: Canon,
    private readonly catalogo: CatalogoVersoes,
    private readonly fonte: FonteVersao,
    private readonly texto: TextoBiblicoRepository,
    private readonly busca: ServicoBusca,
  ) {}

  async executar(
    id: VersaoId,
    {
      aoProgredir,
      sinal,
    }: { aoProgredir?: (p: ProgressoInstalacao) => void; sinal?: AbortSignal } = {},
  ): Promise<void> {
    const versao = doCatalogo(this.catalogo, id);
    if (await this.texto.possuiVersao(versao.id)) return;

    const livros = await carregarVersao(this.canon, this.fonte, versao.id, {
      concorrencia: CONCORRENCIA_DOWNLOAD,
      sinal,
      aoProgredir: (p) => aoProgredir?.({ etapa: 'BAIXANDO', ...p }),
    });
    const total = livros.length;
    try {
      sinal?.throwIfAborted();
      aoProgredir?.({ etapa: 'IMPORTANDO', concluidos: total, total });
      await this.texto.importar(versao.id, livros);
      sinal?.throwIfAborted();
      aoProgredir?.({ etapa: 'INDEXANDO', concluidos: total, total });
      await this.busca.preparar(versao.id);
      sinal?.throwIfAborted();
    } catch (erro) {
      await this.desfazer(versao.id);
      throw erro;
    }
  }

  private async desfazer(id: VersaoId): Promise<void> {
    await Promise.allSettled([this.texto.removerVersao(id), this.busca.descartar(id)]);
  }
}

/** UC10 — Trocar versão: muda a ativa; a posição de leitura fica (RF07.4). */
export class TrocarVersao {
  constructor(
    private readonly canon: Canon,
    private readonly catalogo: CatalogoVersoes,
    private readonly texto: TextoBiblicoRepository,
    private readonly preferencias: PreferenciasRepository,
  ) {}

  async executar(id: VersaoId): Promise<void> {
    const versao = doCatalogo(this.catalogo, id);
    if (!(await this.texto.possuiVersao(versao.id))) throw new VersaoNaoInstaladaError(versao);

    const prefs = await this.preferencias.obter();
    if (prefs?.versaoAtiva === versao.id) return;
    await this.preferencias.salvar(
      prefs
        ? prefs.comVersao(versao.id)
        : Preferencias.criar(versao.id, primeiroCapitulo(this.canon)),
    );
  }
}

/**
 * RF07.5 — Remover versão instalada. A padrão fica (ver `Versao.removivel`); se a removida
 * era a ativa, a padrão passa a ser a ativa. Destaques feitos na versão ficam guardados e
 * voltam se ela for instalada de novo (o texto é o mesmo).
 */
export class RemoverVersao {
  constructor(
    private readonly catalogo: CatalogoVersoes,
    private readonly texto: TextoBiblicoRepository,
    private readonly preferencias: PreferenciasRepository,
    private readonly busca: ServicoBusca,
  ) {}

  async executar(id: VersaoId): Promise<void> {
    const versao = doCatalogo(this.catalogo, id);
    if (!versao.removivel) throw new VersaoNaoRemovivelError(versao);

    const prefs = await this.preferencias.obter();
    if (prefs?.versaoAtiva === versao.id) {
      await this.preferencias.salvar(prefs.comVersao(this.catalogo.padrao().id));
    }
    await this.texto.removerVersao(versao.id);
    await this.busca.descartar(versao.id);
  }
}
