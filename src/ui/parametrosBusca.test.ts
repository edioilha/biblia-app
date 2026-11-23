import { describe, expect, it } from 'vitest';
import { Canon } from '../dominio/biblia';
import {
  caminhoBusca,
  consultaDoEstado,
  ESTADO_INICIAL,
  estadoDaUrl,
  paginasVisiveis,
  parametrosDoEstado,
} from './parametrosBusca';

const canon = new Canon();
const daUrl = (q: string) => estadoDaUrl(new URLSearchParams(q), canon);

describe('estado da busca na URL', () => {
  it('padrões não aparecem; ida e volta preserva o estado', () => {
    expect(caminhoBusca(ESTADO_INICIAL)).toBe('/buscar');
    const url = 'q=amor+de+deus&modo=frase&t=NT&livros=JHN%2C1JN&aprox=1&ordem=biblica&p=3&n=50';
    const estado = daUrl(url);
    expect(estado).toEqual({
      q: 'amor de deus',
      modo: 'FRASE_EXATA',
      testamento: 'NOVO',
      livros: ['JHN', '1JN'],
      aproximada: true,
      ordem: 'CANONICA',
      pagina: 3,
      tamanho: 50,
    });
    expect(parametrosDoEstado(estado).toString()).toBe(url);
  });

  it('ignora valores inválidos e livros fora do testamento', () => {
    const e = daUrl('modo=x&t=ZZ&livros=GEN,XYZ,gen,JHN&p=-2&n=13&ordem=y');
    expect(e).toEqual({ ...ESTADO_INICIAL, livros: ['GEN', 'JHN'] });
    expect(daUrl('t=AT&livros=GEN,JHN').livros).toEqual(['GEN']);
  });

  it('vira ConsultaBusca', () => {
    const c = consultaDoEstado(daUrl('q=luz&t=NT&livros=JHN&p=2'), canon);
    expect([c.termo, c.pagina, c.filtro.testamento, c.filtro.livros.map((l) => l.valor)]).toEqual([
      'luz',
      2,
      'NOVO',
      ['JHN'],
    ]);
  });
});

describe('paginasVisiveis', () => {
  it('primeira, última, vizinhas e reticências', () => {
    expect(paginasVisiveis(1, 1)).toEqual([1]);
    expect(paginasVisiveis(1, 8)).toEqual([1, 2, '…', 8]);
    expect(paginasVisiveis(5, 8)).toEqual([1, '…', 4, 5, 6, 7, 8]);
    expect(paginasVisiveis(4, 8)).toEqual([1, 2, 3, 4, 5, '…', 8]);
    expect(paginasVisiveis(8, 8)).toEqual([1, '…', 7, 8]);
  });
});
