import { describe, expect, it } from 'vitest';
import { Canon } from '../../dominio/biblia';
import { PlanoId } from '../../dominio/planos';
import { PlanosPreDefinidos, dividir } from './PlanosPreDefinidos';

const canon = new Canon();
const catalogo = new PlanosPreDefinidos(canon);
const plano = async (id: string) => {
  const p = await catalogo.porId(PlanoId.de(id));
  if (!p) throw new Error(id);
  return p;
};
const chaves = (caps: readonly { chave(): string }[]) => caps.map((c) => c.chave());

describe('PlanosPreDefinidos (RF06.1)', () => {
  it('oferece os três planos aprovados, nesta ordem', async () => {
    expect((await catalogo.todos()).map((p) => [p.id, p.duracaoDias])).toEqual([
      ['biblia-1-ano', 365],
      ['nt-90-dias', 90],
      ['salmos-proverbios-31-dias', 31],
    ]);
    expect(await catalogo.porId(PlanoId.de('inexistente'))).toBeNull();
  });

  it('Bíblia em 1 ano: os 1.189 capítulos, em ordem, sem repetir, 3 ou 4 por dia', async () => {
    const p = await plano('biblia-1-ano');
    const todos = p.dias.flatMap((d) => chaves(d.capitulos));
    expect(todos).toHaveLength(1189);
    expect(new Set(todos).size).toBe(1189);
    expect(todos[0]).toBe('GEN.1');
    expect(todos.at(-1)).toBe('REV.22');
    expect(new Set(p.dias.map((d) => d.capitulos.length))).toEqual(new Set([3, 4]));
  });

  it('NT em 90 dias: de Mateus 1 a Apocalipse 22', async () => {
    const p = await plano('nt-90-dias');
    const todos = p.dias.flatMap((d) => chaves(d.capitulos));
    expect(todos).toHaveLength(260);
    expect([todos[0], todos.at(-1)]).toEqual(['MAT.1', 'REV.22']);
    expect(p.capitulosPorDia).toBe(3);
  });

  it('Salmos e Provérbios: 5 salmos + 1 provérbio; dia 31 só Provérbios 31', async () => {
    const p = await plano('salmos-proverbios-31-dias');
    expect(chaves(p.dia(1).capitulos)).toEqual([
      'PSA.1',
      'PSA.31',
      'PSA.61',
      'PSA.91',
      'PSA.121',
      'PRO.1',
    ]);
    expect(chaves(p.dia(31).capitulos)).toEqual(['PRO.31']);
    const salmos = p.dias.flatMap((d) => chaves(d.capitulos)).filter((c) => c.startsWith('PSA'));
    expect(new Set(salmos).size).toBe(150);
  });

  it('dividir distribui com diferença máxima de um item', () => {
    expect(dividir([1, 2, 3, 4, 5, 6, 7], 3).map((d) => d.length)).toEqual([2, 2, 3]);
  });
});
