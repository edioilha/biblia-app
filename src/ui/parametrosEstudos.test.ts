import { describe, expect, it } from 'vitest';
import { Canon } from '../dominio/biblia';
import {
  ESTADO_INICIAL_ESTUDOS,
  caminhoEstudos,
  consultaEstudosDoEstado,
  estadoEstudosDaUrl,
  parametrosEstudos,
} from './parametrosEstudos';

const canon = new Canon();
const daUrl = (q: string) => estadoEstudosDaUrl(new URLSearchParams(q), canon);

describe('estado de Meus Estudos na URL', () => {
  it('sem parâmetros = estado inicial, e o estado inicial não aparece na URL', () => {
    expect(daUrl('')).toEqual(ESTADO_INICIAL_ESTUDOS);
    expect(parametrosEstudos(ESTADO_INICIAL_ESTUDOS).toString()).toBe('');
    expect(caminhoEstudos()).toBe('/estudos');
  });

  it('ida e volta', () => {
    const estado = {
      aba: 'ANOTACOES',
      q: 'luz do mundo',
      livro: 'JHN',
      ordem: 'RECENTES',
      pagina: 3,
    } as const;
    const url = parametrosEstudos(estado).toString();
    expect(url).toBe('aba=anotacoes&q=luz+do+mundo&livro=JHN&ordem=recentes&p=3');
    expect(daUrl(url)).toEqual(estado);
  });

  it('ignora valores inválidos', () => {
    expect(daUrl('aba=xyz&livro=ZZZ&ordem=alfabetica&p=-2')).toEqual(ESTADO_INICIAL_ESTUDOS);
    expect(daUrl('livro=jhn&p=0')).toMatchObject({ livro: 'JHN', pagina: 1 });
  });

  it('gera a consulta do domínio', () => {
    const c = consultaEstudosDoEstado(daUrl('aba=destaques&q=amor&livro=ROM&p=2'));
    expect([c.aba, c.texto, c.livro?.valor, c.pagina, c.tamanhoPagina]).toEqual([
      'DESTAQUES',
      'amor',
      'ROM',
      2,
      20,
    ]);
    expect(caminhoEstudos({ aba: 'ANOTACOES', q: 'fé' })).toBe('/estudos?aba=anotacoes&q=f%C3%A9');
  });
});
