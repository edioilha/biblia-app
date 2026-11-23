import { describe, expect, it } from 'vitest';
import { capituloJo3, destaque, idDestaque, intervalo, notacao } from '../../test/destaques';
import type { Destaque } from './Destaque';
import { SobreposicaoDestaques } from './SobreposicaoDestaques';
import { TextoDoCapitulo } from './TextoDoCapitulo';

// Jo 3:1 "aaa bbb ccc ddd" · 3:2 "eee fff ggg" · 3:3 "hhh iii"
function regras() {
  let n = 100;
  return new SobreposicaoDestaques(new TextoDoCapitulo(capituloJo3()), () => idDestaque(++n));
}
const resumo = (lista: readonly Destaque[]) =>
  lista.map((d) => `${Number(d.id.slice(-3))} ${d.cor} ${notacao(d.intervalo)}`);

describe('SobreposicaoDestaques.aplicar', () => {
  it('sem vizinhos, só salva o novo', () => {
    const r = regras().aplicar(destaque(9, '1:4-1:7'), [destaque(1, '2:0-2:3')]);
    expect(resumo(r.alteracoes.salvar)).toEqual(['9 AMARELO 1:4-1:7']);
    expect(r.alteracoes.remover).toEqual([]);
  });

  it('funde com a mesma cor quando sobrepõe (A1), mantendo o mais antigo', () => {
    const r = regras().aplicar(destaque(9, '1:8-2:3'), [destaque(1, '1:4-1:11')]);
    expect(resumo([r.destaque])).toEqual(['1 AMARELO 1:4-2:3']);
    expect(resumo(r.alteracoes.salvar)).toEqual(['1 AMARELO 1:4-2:3']);
    expect(r.alteracoes.remover).toEqual([]);
  });

  it('funde com a mesma cor separada só por espaço, inclusive entre versículos', () => {
    const r = regras().aplicar(destaque(9, '1:12-1:15'), [
      destaque(1, '1:4-1:11'),
      destaque(2, '2:0-2:3'),
      destaque(3, '3:0-3:3'),
    ]);
    expect(resumo([r.destaque])).toEqual(['1 AMARELO 1:4-2:3']);
    expect(r.alteracoes.remover).toEqual([idDestaque(2)]);
  });

  it('não funde com a mesma cor separada por texto', () => {
    const r = regras().aplicar(destaque(9, '1:8-1:11'), [destaque(1, '1:0-1:3')]);
    expect(resumo(r.alteracoes.salvar)).toEqual(['9 AMARELO 1:8-1:11']);
  });

  it('corta destaque de outra cor no trecho sobreposto (o novo vence)', () => {
    const r = regras().aplicar(destaque(9, '1:8-2:3', 'ROSA'), [destaque(1, '1:0-1:11')]);
    expect(resumo(r.alteracoes.salvar)).toEqual(['9 ROSA 1:8-2:3', '1 AMARELO 1:0-1:7']);
  });

  it('divide em dois o destaque de outra cor que contém o novo', () => {
    const antigo = destaque(1, '1:0-2:11', 'VERDE');
    const r = regras().aplicar(destaque(9, '1:8-1:11', 'AZUL'), [antigo]);
    expect(resumo(r.alteracoes.salvar)).toEqual([
      '9 AZUL 1:8-1:11',
      '1 VERDE 1:0-1:7',
      '101 VERDE 1:12-2:11',
    ]);
    expect(r.alteracoes.salvar[2]?.criadoEm).toEqual(antigo.criadoEm);
  });

  it('remove destaque de outra cor coberto por inteiro', () => {
    const r = regras().aplicar(destaque(9, '1:0-2:11', 'ROSA'), [destaque(1, '1:4-1:7')]);
    expect(r.alteracoes.remover).toEqual([idDestaque(1)]);
  });

  it('ao trocar a cor de um existente, funde com vizinhos da nova cor', () => {
    const existentes = [destaque(1, '1:0-1:3', 'ROSA'), destaque(2, '1:4-1:7')];
    const r = regras().aplicar(existentes[1]?.comCor('ROSA') ?? destaque(0, '1:0-1:1'), existentes);
    expect(resumo([r.destaque])).toEqual(['1 ROSA 1:0-1:7']);
    expect(r.alteracoes.remover).toEqual([idDestaque(2)]);
  });
});

describe('SobreposicaoDestaques.apagar', () => {
  it('tira o trecho de todos os destaques que o cobrem', () => {
    const r = regras().apagar(intervalo('2:0-2:11'), [
      destaque(1, '1:4-2:7'),
      destaque(2, '2:8-3:3', 'ROSA'),
      destaque(3, '3:4-3:7'),
    ]);
    expect(resumo(r.salvar)).toEqual(['1 AMARELO 1:4-1:15', '2 ROSA 3:0-3:3']);
    expect(r.remover).toEqual([]);
  });

  it('remove o que fica sem texto', () => {
    const r = regras().apagar(intervalo('1:0-1:15'), [destaque(1, '1:4-1:7')]);
    expect(r.remover).toEqual([idDestaque(1)]);
    expect(r.salvar).toEqual([]);
  });
});
