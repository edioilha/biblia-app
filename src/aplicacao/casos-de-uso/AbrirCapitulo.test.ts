import { beforeEach, describe, expect, it } from 'vitest';
import { Canon, Referencia, VersaoId } from '../../dominio/biblia';
import { Preferencias } from '../../dominio/preferencias';
import { livroSintetico, PreferenciasEmMemoria, TextoBiblicoEmMemoria } from '../../test/fakes';
import { AbrirCapitulo, CapituloIndisponivelError } from './AbrirCapitulo';

const canon = new Canon();
const blivre = VersaoId.de('BLIVRE');
const ref = (texto: string) => Referencia.parse(texto, canon);

describe('AbrirCapitulo', () => {
  let texto: TextoBiblicoEmMemoria;
  let prefs: PreferenciasEmMemoria;
  let uc: AbrirCapitulo;

  beforeEach(async () => {
    texto = new TextoBiblicoEmMemoria(canon);
    await texto.importar(
      blivre,
      ['GEN', 'JHN', 'REV'].map((c) => livroSintetico(canon, c)),
    );
    prefs = new PreferenciasEmMemoria();
    uc = new AbrirCapitulo(canon, texto, prefs, blivre);
  });

  it('devolve o capítulo com livro e navegação', async () => {
    const aberto = await uc.executar(ref('Jo 3'));
    expect(aberto.capitulo.referencia.chave()).toBe('JHN.3');
    expect(aberto.capitulo.versiculo(2)?.texto).toBe('JHN 3:2');
    expect(aberto.livro.nome).toBe('João');
    expect(aberto.anterior?.chave()).toBe('JHN.2');
    expect(aberto.proximo?.chave()).toBe('JHN.4');
    expect(aberto.versiculoEmFoco).toBeNull();
  });

  it('abre o capítulo do versículo pedido e informa o foco (UC02)', async () => {
    const aberto = await uc.executar(ref('Jo 3:16'));
    expect(aberto.capitulo.referencia.chave()).toBe('JHN.3');
    expect(aberto.versiculoEmFoco).toBe(16);
  });

  it('desabilita a navegação nos limites do cânon (A2)', async () => {
    expect((await uc.executar(ref('Gn 1'))).anterior).toBeNull();
    expect((await uc.executar(ref('Ap 22'))).proximo).toBeNull();
  });

  it('salva a última posição, inclusive na primeira execução', async () => {
    await uc.executar(ref('Gn 1'));
    expect(prefs.atual?.ultimaPosicao.chave()).toBe('GEN.1');
    expect(prefs.atual?.versaoAtiva).toBe('BLIVRE');

    await uc.executar(ref('Jo 3:16'));
    expect(prefs.atual?.ultimaPosicao.chave()).toBe('JHN.3');
  });

  it('não regrava quando o capítulo é o mesmo', async () => {
    prefs.atual = Preferencias.criar(blivre, ref('Jo 3'));
    await uc.executar(ref('Jo 3:16'));
    expect(prefs.salvamentos).toBe(0);
  });

  it('usa a versão ativa das preferências', async () => {
    const tb = VersaoId.de('TB');
    prefs.atual = Preferencias.criar(tb, ref('Gn 1'));
    await expect(uc.executar(ref('Jo 3'))).rejects.toThrow(CapituloIndisponivelError);

    await texto.importar(tb, [livroSintetico(canon, 'JHN')]);
    expect((await uc.executar(ref('Jo 3'))).capitulo.versaoId).toBe('TB');
  });

  it('falha sem salvar posição se o capítulo não existe na versão', async () => {
    await expect(uc.executar(ref('Rm 8'))).rejects.toThrow(CapituloIndisponivelError);
    expect(prefs.atual).toBeNull();
  });
});
