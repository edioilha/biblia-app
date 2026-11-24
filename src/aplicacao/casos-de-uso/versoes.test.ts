import { beforeEach, describe, expect, it } from 'vitest';
import { Canon, Referencia, VersaoId } from '../../dominio/biblia';
import { Preferencias } from '../../dominio/preferencias';
import { VersoesDisponiveis } from '../../infraestrutura/versoes';
import { BuscaEmMemoria } from '../../test/busca';
import {
  FonteSintetica,
  livroSintetico,
  PreferenciasEmMemoria,
  TextoBiblicoEmMemoria,
} from '../../test/fakes';
import { VersaoCorrompidaError } from './carregarVersao';
import {
  InstalarVersao,
  ListarVersoes,
  ObterVersaoAtiva,
  RemoverVersao,
  TrocarVersao,
  VersaoForaDoCatalogoError,
  VersaoNaoInstaladaError,
  VersaoNaoRemovivelError,
  type ProgressoInstalacao,
} from './versoes';

const canon = new Canon();
const catalogo = new VersoesDisponiveis();
const BLIVRE = VersaoId.de('BLIVRE');
const TB = VersaoId.de('TB');
const ALM = VersaoId.de('ALM1911');
const ref = (texto: string) => Referencia.parse(texto, canon);

let texto: TextoBiblicoEmMemoria;
let prefs: PreferenciasEmMemoria;
let busca: BuscaEmMemoria;

beforeEach(async () => {
  texto = new TextoBiblicoEmMemoria(canon);
  await texto.importar(BLIVRE, [livroSintetico(canon, 'JHN')]);
  prefs = new PreferenciasEmMemoria();
  busca = new BuscaEmMemoria();
});

describe('ObterVersaoAtiva', () => {
  it('é a padrão sem preferência salva ou com sigla fora do catálogo', async () => {
    const uc = new ObterVersaoAtiva(catalogo, prefs);
    expect((await uc.executar()).id).toBe(BLIVRE);

    prefs.atual = Preferencias.criar(VersaoId.de('NVI'), ref('Jo 3'));
    expect((await uc.executar()).id).toBe(BLIVRE);
  });

  it('é a das preferências', async () => {
    prefs.atual = Preferencias.criar(TB, ref('Jo 3'));
    expect((await new ObterVersaoAtiva(catalogo, prefs).executar()).nome).toBe(
      'Tradução Brasileira',
    );
  });
});

describe('ListarVersoes (RF07.2)', () => {
  it('lista o catálogo com instalada e ativa', async () => {
    await texto.importar(TB, [livroSintetico(canon, 'JHN')]);
    prefs.atual = Preferencias.criar(TB, ref('Jo 3'));
    const itens = await new ListarVersoes(
      catalogo,
      texto,
      new ObterVersaoAtiva(catalogo, prefs),
    ).executar();

    expect(itens.map((i) => [i.versao.id, i.instalada, i.ativa])).toEqual([
      [BLIVRE, true, false],
      [TB, true, true],
      [ALM, false, false],
    ]);
  });
});

describe('InstalarVersao (UC09)', () => {
  const instalar = (fonte = new FonteSintetica(canon)) =>
    new InstalarVersao(canon, catalogo, fonte, texto, busca);

  it('baixa os 66 livros, importa e indexa, informando cada etapa', async () => {
    const fonte = new FonteSintetica(canon);
    const progresso: ProgressoInstalacao[] = [];
    await instalar(fonte).executar(TB, { aoProgredir: (p) => progresso.push(p) });

    expect(fonte.carregados).toBe(66);
    expect(await texto.possuiVersao(TB)).toBe(true);
    expect(texto.versoes.get(TB)?.size).toBe(66);
    expect(busca.preparadas).toEqual([TB]);
    const baixando = progresso.filter((p) => p.etapa === 'BAIXANDO');
    expect(baixando).toHaveLength(66);
    expect(baixando.at(-1)).toEqual({ etapa: 'BAIXANDO', concluidos: 66, total: 66 });
    expect(progresso.slice(-2).map((p) => p.etapa)).toEqual(['IMPORTANDO', 'INDEXANDO']);
  });

  it('versão já instalada: não baixa de novo', async () => {
    const fonte = new FonteSintetica(canon);
    await instalar(fonte).executar(BLIVRE);
    expect(fonte.carregados).toBe(0);
  });

  it('rejeita sigla fora do catálogo', async () => {
    await expect(instalar().executar(VersaoId.de('NVI'))).rejects.toThrow(
      VersaoForaDoCatalogoError,
    );
  });

  it('A1 — falha de rede: nada é importado e a falha chega ao chamador', async () => {
    const fonte = new FonteSintetica(canon, { falharEm: 'PSA' });
    await expect(instalar(fonte).executar(TB)).rejects.toThrow(/rede em PSA/);
    expect(await texto.possuiVersao(TB)).toBe(false);
    expect(busca.preparadas).toEqual([]);
  });

  it('A2 — dados inválidos: aborta sem importar', async () => {
    const corrompida = {
      carregarLivro: async (
        _v: VersaoId,
        livro: Parameters<FonteSintetica['carregarLivro']>[1],
      ) => {
        const l = livroSintetico(canon, livro.valor);
        return livro.valor === 'GEN' ? { ...l, capitulos: l.capitulos.slice(1) } : l;
      },
    };
    await expect(
      new InstalarVersao(canon, catalogo, corrompida, texto, busca).executar(TB),
    ).rejects.toThrow(VersaoCorrompidaError);
    expect(await texto.possuiVersao(TB)).toBe(false);
  });

  it('cancelar durante o download não importa nada', async () => {
    const fonte = new FonteSintetica(canon);
    fonte.segurar();
    const controle = new AbortController();
    const instalacao = instalar(fonte).executar(TB, { sinal: controle.signal });
    controle.abort();
    fonte.liberar();

    await expect(instalacao).rejects.toThrow();
    expect(await texto.possuiVersao(TB)).toBe(false);
  });

  it('falha na indexação desfaz a importação', async () => {
    const quebrada = new BuscaEmMemoria();
    quebrada.preparar = async () => {
      throw new Error('sem memória');
    };
    await expect(
      new InstalarVersao(canon, catalogo, new FonteSintetica(canon), texto, quebrada).executar(TB),
    ).rejects.toThrow('sem memória');
    expect(await texto.possuiVersao(TB)).toBe(false);
    expect(quebrada.descartadas).toEqual([TB]);
  });
});

describe('TrocarVersao (UC10)', () => {
  it('muda a versão ativa mantendo a posição de leitura', async () => {
    await texto.importar(TB, [livroSintetico(canon, 'JHN')]);
    prefs.atual = Preferencias.criar(BLIVRE, ref('Jo 3'));
    await new TrocarVersao(canon, catalogo, texto, prefs).executar(TB);

    expect(prefs.atual?.versaoAtiva).toBe(TB);
    expect(prefs.atual?.ultimaPosicao.chave()).toBe('JHN.3');
  });

  it('sem preferências salvas, começa em Gênesis 1', async () => {
    await texto.importar(TB, [livroSintetico(canon, 'JHN')]);
    await new TrocarVersao(canon, catalogo, texto, prefs).executar(TB);
    expect(prefs.atual?.versaoAtiva).toBe(TB);
    expect(prefs.atual?.ultimaPosicao.chave()).toBe('GEN.1');
  });

  it('rejeita versão não instalada', async () => {
    await expect(new TrocarVersao(canon, catalogo, texto, prefs).executar(TB)).rejects.toThrow(
      VersaoNaoInstaladaError,
    );
  });
});

describe('RemoverVersao (RF07.5)', () => {
  const remover = () => new RemoverVersao(catalogo, texto, prefs, busca);

  it('remove o texto e o índice da versão', async () => {
    await texto.importar(TB, [livroSintetico(canon, 'JHN')]);
    await remover().executar(TB);
    expect(await texto.possuiVersao(TB)).toBe(false);
    expect(busca.descartadas).toEqual([TB]);
  });

  it('removendo a ativa, a padrão volta a ser a ativa (a posição fica)', async () => {
    await texto.importar(TB, [livroSintetico(canon, 'JHN')]);
    prefs.atual = Preferencias.criar(TB, ref('Jo 3'));
    await remover().executar(TB);
    expect(prefs.atual?.versaoAtiva).toBe(BLIVRE);
    expect(prefs.atual?.ultimaPosicao.chave()).toBe('JHN.3');
  });

  it('a versão padrão não pode ser removida', async () => {
    await expect(remover().executar(BLIVRE)).rejects.toThrow(VersaoNaoRemovivelError);
    expect(await texto.possuiVersao(BLIVRE)).toBe(true);
  });
});
