import type { Canon, Capitulo, Referencia, VersaoId } from '../../dominio/biblia';
import { Pagina } from '../../dominio/busca';
import {
  TextoDoCapitulo,
  referenciaDaMarcacao,
  type AbaEstudos,
  type ConsultaEstudos,
  type ItemEstudo,
  type MarcacaoEstudo,
} from '../../dominio/estudo';
import type {
  AnotacaoRepository,
  DestaqueRepository,
  FavoritoRepository,
  TextoBiblicoRepository,
} from '../portas';

/** UC13 — página da aba escolhida e o total de cada aba (com os mesmos filtros). */
export interface ResultadoEstudos {
  readonly pagina: Pagina<ItemEstudo>;
  readonly totais: Readonly<Record<AbaEstudos, number>>;
}

/**
 * UC13 — Consultar Meus Estudos (RF09, RF03.2, RF04.6, RF05.6). Os dados do leitor são
 * poucos (centenas, não milhões), então filtro, ordem e paginação rodam em memória sobre as
 * marcações. O texto bíblico só é lido quando preciso: para o filtro de texto (todas as
 * abas, para os totais) ou só para os itens da página. Favoritos e anotações valem para
 * qualquer versão; os destaques e o texto são da versão exibida.
 */
export class ListarEstudos {
  constructor(
    private readonly canon: Canon,
    private readonly textoBiblico: TextoBiblicoRepository,
    private readonly favoritos: FavoritoRepository,
    private readonly destaques: DestaqueRepository,
    private readonly anotacoes: AnotacaoRepository,
  ) {}

  /** `versao` = a versão exibida (ativa): dela vêm os destaques e o texto. */
  async executar(versao: VersaoId, consulta: ConsultaEstudos): Promise<ResultadoEstudos> {
    const [favoritos, destaques, anotacoes] = await Promise.all([
      this.favoritos.todos(),
      this.destaques.daVersao(versao),
      this.anotacoes.todas(),
    ]);
    const porAba: Record<AbaEstudos, MarcacaoEstudo[]> = {
      FAVORITOS: favoritos.map((favorito) => ({ tipo: 'FAVORITO', favorito })),
      DESTAQUES: destaques.map((destaque) => ({ tipo: 'DESTAQUE', destaque })),
      ANOTACOES: anotacoes.map((anotacao) => ({ tipo: 'ANOTACAO', anotacao })),
    };

    const textos = new TextosDoEstudo(this.textoBiblico, versao);
    const filtrar = async (marcacoes: MarcacaoEstudo[]) => {
      const doLivro = marcacoes.filter((m) => consulta.doLivro(m));
      if (!consulta.filtraTexto) return doLivro;
      const comTexto = await Promise.all(
        doLivro.map(async (m) => [m, await textos.de(m)] as const),
      );
      return comTexto.filter(([m, t]) => consulta.correspondeTexto(m, t)).map(([m]) => m);
    };
    const [fav, des, ano] = await Promise.all([
      filtrar(porAba.FAVORITOS),
      filtrar(porAba.DESTAQUES),
      filtrar(porAba.ANOTACOES),
    ]);
    const filtrados: Record<AbaEstudos, MarcacaoEstudo[]> = {
      FAVORITOS: fav,
      DESTAQUES: des,
      ANOTACOES: ano,
    };

    const lista = filtrados[consulta.aba].sort((a, b) => consulta.comparar(a, b, this.canon));
    const recorte = Pagina.de(lista, consulta.pagina, consulta.tamanhoPagina);
    const itens = await Promise.all(
      recorte.itens.map(async (m) => comTexto(m, await textos.de(m))),
    );

    return {
      pagina: new Pagina(itens, recorte.pagina, recorte.tamanhoPagina, recorte.total),
      totais: { FAVORITOS: fav.length, DESTAQUES: des.length, ANOTACOES: ano.length },
    };
  }
}

function comTexto(m: MarcacaoEstudo, texto: string): ItemEstudo {
  switch (m.tipo) {
    case 'FAVORITO':
      return { tipo: 'FAVORITO', favorito: m.favorito, texto };
    case 'DESTAQUE':
      return { tipo: 'DESTAQUE', destaque: m.destaque, texto };
    case 'ANOTACAO':
      return { tipo: 'ANOTACAO', anotacao: m.anotacao, texto };
  }
}

/** Lê cada capítulo uma vez por consulta. Sem o capítulo na versão, o texto fica vazio. */
class TextosDoEstudo {
  private readonly capitulos = new Map<string, Promise<Capitulo | null>>();

  constructor(
    private readonly repositorio: TextoBiblicoRepository,
    private readonly versao: VersaoId,
  ) {}

  async de(m: MarcacaoEstudo): Promise<string> {
    const ref = referenciaDaMarcacao(m);
    const capitulo = await this.capitulo(ref);
    if (!capitulo) return '';
    if (m.tipo === 'DESTAQUE') {
      try {
        return new TextoDoCapitulo(capitulo).trecho(m.destaque.intervalo);
      } catch {
        return '';
      }
    }
    return capitulo.versiculo(ref.versiculo ?? 0)?.texto ?? '';
  }

  private capitulo(ref: Referencia): Promise<Capitulo | null> {
    const chave = ref.doCapitulo().chave();
    let capitulo = this.capitulos.get(chave);
    if (!capitulo) {
      capitulo = this.repositorio.obterCapitulo(this.versao, ref.doCapitulo());
      this.capitulos.set(chave, capitulo);
    }
    return capitulo;
  }
}
