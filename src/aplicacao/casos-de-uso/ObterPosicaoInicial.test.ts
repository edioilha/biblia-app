import { describe, expect, it } from 'vitest';
import { Canon, Referencia, VersaoId } from '../../dominio/biblia';
import { Preferencias } from '../../dominio/preferencias';
import { PreferenciasEmMemoria } from '../../test/fakes';
import { ObterPosicaoInicial } from './ObterPosicaoInicial';

const canon = new Canon();

describe('ObterPosicaoInicial', () => {
  it('abre em Gênesis 1 na primeira execução', async () => {
    const uc = new ObterPosicaoInicial(canon, new PreferenciasEmMemoria());
    expect((await uc.executar()).chave()).toBe('GEN.1');
  });

  it('abre na última posição salva', async () => {
    const prefs = Preferencias.criar(VersaoId.de('BLIVRE'), Referencia.parse('Jo 3', canon));
    const uc = new ObterPosicaoInicial(canon, new PreferenciasEmMemoria(prefs));
    expect((await uc.executar()).chave()).toBe('JHN.3');
  });
});
