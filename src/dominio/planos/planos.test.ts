import { describe, expect, it } from 'vitest';
import { Canon, Referencia } from '../biblia';
import { DataInvalidaError, DataLocal } from './DataLocal';
import { InscricaoId, InscricaoInvalidaError, InscricaoPlano } from './InscricaoPlano';
import { PlanoId, PlanoInvalidoError, PlanoLeitura } from './PlanoLeitura';

const canon = new Canon();
const cap = (t: string) => Referencia.parse(t, canon);
const data = (iso: string) => DataLocal.iso(iso);
const ID = InscricaoId.de('00000000-0000-7000-8000-000000000001');
const PLANO = PlanoId.de('teste-10-dias');
const inscricao = (inicio = '2026-11-01', dias: number[] = [], total = 10) =>
  InscricaoPlano.criar(ID, PLANO, total, data(inicio), dias);

describe('DataLocal', () => {
  it('conta dias de calendário, inclusive na virada do mês e do horário de verão', () => {
    expect(data('2026-11-01').diasAte(data('2026-11-24'))).toBe(23);
    expect(data('2026-02-28').somarDias(1).paraIso()).toBe('2026-03-01');
    expect(data('2026-10-31').diasAte(data('2026-11-02'))).toBe(2);
    expect(data('2026-11-24').formatar()).toBe('24/11/2026');
  });

  it('usa o dia local do instante, não o dia em UTC', () => {
    // 23:30 local é o mesmo dia local, qualquer que seja o fuso.
    expect(DataLocal.de(new Date(2026, 10, 24, 23, 30)).paraIso()).toBe('2026-11-24');
    expect(DataLocal.de(new Date(2026, 10, 24, 0, 5)).paraIso()).toBe('2026-11-24');
  });

  it('rejeita textos e datas inexistentes', () => {
    expect(() => DataLocal.iso('24/11/2026')).toThrow(DataInvalidaError);
    expect(() => DataLocal.iso('2026-02-30')).toThrow(DataInvalidaError);
    expect(() => DataLocal.de(new Date('x'))).toThrow(DataInvalidaError);
  });
});

describe('PlanoLeitura', () => {
  const plano = PlanoLeitura.criar(PLANO, 'Teste', 'desc', [
    [cap('Sl 1'), cap('Sl 2'), cap('Sl 3'), cap('Pv 1')],
    [cap('Sl 31'), cap('Sl 61')],
  ]);

  it('numera os dias e calcula a média de capítulos', () => {
    expect(plano.duracaoDias).toBe(2);
    expect(plano.totalCapitulos).toBe(6);
    expect(plano.capitulosPorDia).toBe(3);
    expect(plano.dia(2).numero).toBe(2);
    expect(() => plano.dia(3)).toThrow(PlanoInvalidoError);
  });

  it('agrupa capítulos seguidos do mesmo livro', () => {
    expect(
      plano
        .dia(1)
        .sequencias()
        .map((s) => [s.livro.valor, s.de, s.ate]),
    ).toEqual([
      ['PSA', 1, 3],
      ['PRO', 1, 1],
    ]);
    expect(plano.dia(2).sequencias()).toHaveLength(2);
  });

  it('sabe se um capítulo (ou versículo dele) faz parte do dia', () => {
    expect(plano.dia(1).contem(cap('Sl 2:5'))).toBe(true);
    expect(plano.dia(1).contem(cap('Sl 4'))).toBe(false);
  });

  it('rejeita plano ou dia vazio e id inválido', () => {
    expect(() => PlanoLeitura.criar(PLANO, 'x', '', [])).toThrow(PlanoInvalidoError);
    expect(() => PlanoLeitura.criar(PLANO, 'x', '', [[]])).toThrow(PlanoInvalidoError);
    expect(() => PlanoId.de('Bíblia em 1 ano')).toThrow(PlanoInvalidoError);
  });
});

describe('InscricaoPlano (UC07/UC08)', () => {
  it('dia do plano: começa no dia 1, para no último, null antes do início', () => {
    const i = inscricao('2026-11-01');
    expect(i.diaDe(data('2026-11-01'))).toBe(1);
    expect(i.diaDe(data('2026-11-05'))).toBe(5);
    expect(i.diaDe(data('2027-01-01'))).toBe(10);
    expect(i.diaDe(data('2026-10-31'))).toBeNull();
    expect(i.dataDoDia(3).paraIso()).toBe('2026-11-03');
  });

  it('dias em atraso: anteriores a hoje e não concluídos (A1)', () => {
    const i = inscricao('2026-11-01', [1, 3]);
    expect(i.diasAtrasados(data('2026-11-05'))).toEqual([2, 4]);
    expect(i.diasAtrasados(data('2026-11-01'))).toEqual([]);
    expect(i.diasAtrasados(data('2026-10-20'))).toEqual([]);
    // Depois do fim, todos os pendentes estão em atraso.
    expect(
      inscricao('2026-11-01', [1, 2, 3, 4, 5, 6, 7, 8]).diasAtrasados(data('2026-12-01')),
    ).toEqual([9, 10]);
  });

  it('conclui e desfaz dias em qualquer ordem, sem mutar o original', () => {
    const i = inscricao();
    const j = i.concluirDia(5).concluirDia(2);
    expect([...j.diasConcluidos].sort()).toEqual([2, 5]);
    expect(i.diasConcluidos.size).toBe(0);
    expect(j.concluirDia(5)).toBe(j);
    expect(j.desfazerDia(5).concluido(5)).toBe(false);
    expect(() => i.concluirDia(11)).toThrow(InscricaoInvalidaError);
  });

  it('progresso e conclusão do plano (A3)', () => {
    expect(inscricao('2026-11-01', [1, 2, 3]).progresso()).toEqual({
      concluidos: 3,
      total: 10,
      percentual: 30,
    });
    expect(inscricao('2026-11-01', [1, 2], 3).progresso().percentual).toBe(66);
    const quase = inscricao('2026-11-01', [1, 2], 3);
    expect(quase.status).toBe('EM_ANDAMENTO');
    expect(quase.concluirDia(3).status).toBe('CONCLUIDO');
    expect(quase.concluirDia(3).primeiroPendente()).toBeNull();
  });

  it('reagendar: o primeiro dia pendente passa a cair hoje (A2)', () => {
    const hoje = data('2026-11-10');
    const i = inscricao('2026-11-01', [1, 2, 3, 5]);
    expect(i.diasAtrasados(hoje)).toEqual([4, 6, 7, 8, 9]);

    const r = i.reagendar(hoje);
    expect(r.diaDe(hoje)).toBe(4);
    expect(r.inicio.paraIso()).toBe('2026-11-07');
    expect(r.diasAtrasados(hoje)).toEqual([]);
    expect([...r.diasConcluidos].sort()).toEqual([1, 2, 3, 5]);
  });

  it('reagendar sem atraso não muda nada', () => {
    const i = inscricao('2026-11-01', [1, 2]);
    expect(i.reagendar(data('2026-11-03'))).toBe(i);
  });

  it('rejeita total ou dias fora do plano ao reconstituir', () => {
    expect(() => inscricao('2026-11-01', [], 0)).toThrow(InscricaoInvalidaError);
    expect(() => inscricao('2026-11-01', [0])).toThrow(InscricaoInvalidaError);
    expect(() => InscricaoId.de('x')).toThrow(InscricaoInvalidaError);
  });
});
