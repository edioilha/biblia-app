import { describe, expect, it } from 'vitest';
import { Referencia, VersaoId } from '../../dominio/biblia';
import { ConfiguracaoLeitura, Preferencias } from '../../dominio/preferencias';
import { canon } from '../../test/destaques';
import { PreferenciasEmMemoria } from '../../test/fakes';
import { ConfigurarLeitura } from './ConfigurarLeitura';

const BLIVRE = VersaoId.de('BLIVRE');

describe('ConfigurarLeitura (UC12)', () => {
  it('na primeira execução, a padrão; salvar cria as preferências', async () => {
    const prefs = new PreferenciasEmMemoria();
    const uc = new ConfigurarLeitura(canon, prefs, BLIVRE);
    expect(await uc.obter()).toBe(ConfiguracaoLeitura.padrao);

    await uc.executar(ConfiguracaoLeitura.criar('ESCURO', 4));
    expect(prefs.atual?.leitura).toEqual(ConfiguracaoLeitura.criar('ESCURO', 4));
    expect(prefs.atual?.versaoAtiva).toBe('BLIVRE');
    expect(prefs.atual?.ultimaPosicao.chave()).toBe('GEN.1');
  });

  it('mantém versão e posição; não grava se nada mudou', async () => {
    const prefs = new PreferenciasEmMemoria(
      Preferencias.criar(VersaoId.de('TB'), Referencia.parse('Jo 3', canon)),
    );
    const uc = new ConfigurarLeitura(canon, prefs, BLIVRE);
    await uc.executar(ConfiguracaoLeitura.padrao);
    expect(prefs.salvamentos).toBe(0);

    await uc.executar(ConfiguracaoLeitura.criar('SEPIA', 3));
    expect(prefs.salvamentos).toBe(1);
    expect(prefs.atual?.versaoAtiva).toBe('TB');
    expect(prefs.atual?.ultimaPosicao.chave()).toBe('JHN.3');
    expect((await uc.obter()).tema).toBe('SEPIA');
  });
});
