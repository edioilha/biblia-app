import { describe, expect, it } from 'vitest';
import { Canon, Referencia, VersaoId } from '../biblia';
import { Preferencias } from './Preferencias';

const canon = new Canon();
const ref = (texto: string) => Referencia.parse(texto, canon);
const blivre = VersaoId.de('BLIVRE');

describe('Preferencias', () => {
  it('guarda a posição no nível do capítulo', () => {
    const p = Preferencias.criar(blivre, ref('Jo 3:16'));
    expect(p.versaoAtiva).toBe('BLIVRE');
    expect(p.ultimaPosicao.chave()).toBe('JHN.3');
  });

  it('comPosicao devolve nova instância sem alterar a original', () => {
    const p = Preferencias.criar(blivre, ref('Gn 1'));
    const q = p.comPosicao(ref('Rm 8:28'));
    expect(q.ultimaPosicao.chave()).toBe('ROM.8');
    expect(q.versaoAtiva).toBe('BLIVRE');
    expect(p.ultimaPosicao.chave()).toBe('GEN.1');
  });

  it('comPosicao no mesmo capítulo devolve a mesma instância', () => {
    const p = Preferencias.criar(blivre, ref('Gn 1'));
    expect(p.comPosicao(ref('Gn 1:5'))).toBe(p);
  });
});

describe('Preferencias — leitura (UC12)', () => {
  it('começa com a configuração padrão e troca sem mexer na versão e na posição', async () => {
    const { ConfiguracaoLeitura } = await import('./ConfiguracaoLeitura');
    const p = Preferencias.criar(blivre, ref('Jo 3'));
    expect(p.leitura).toBe(ConfiguracaoLeitura.padrao);

    const escuro = ConfiguracaoLeitura.criar('ESCURO', 5);
    const q = p.comLeitura(escuro);
    expect(q.leitura).toBe(escuro);
    expect(q.ultimaPosicao.chave()).toBe('JHN.3');
    expect(q.comLeitura(ConfiguracaoLeitura.criar('ESCURO', 5))).toBe(q);
    expect(q.comPosicao(ref('Rm 8')).leitura).toBe(escuro);
    expect(q.comVersao(VersaoId.de('TB')).leitura).toBe(escuro);
  });
});
