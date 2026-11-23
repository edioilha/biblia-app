import { describe, expect, it } from 'vitest';
import { anotacao, idAnotacao } from '../../test/anotacoes';
import { canon, idDestaque } from '../../test/destaques';
import { Referencia } from '../biblia';
import {
  Anotacao,
  AnotacaoId,
  AnotacaoIdInvalidoError,
  AnotacaoInvalidaError,
  ModoExibicao,
  TAMANHO_MAXIMO_ANOTACAO,
} from './Anotacao';

const ref = (t: string) => Referencia.parse(t, canon);
const agora = new Date('2026-11-22T12:00:00Z');

describe('AnotacaoId e ModoExibicao', () => {
  it('valida UUID', () => {
    expect(() => AnotacaoId.de('x')).toThrow(AnotacaoIdInvalidoError);
  });

  it('tem rodapé como padrão e valida valores gravados', () => {
    expect(ModoExibicao.padrao).toBe('RODAPE');
    expect(ModoExibicao.de('INLINE')).toBe('INLINE');
    expect(() => ModoExibicao.de('lateral')).toThrow(AnotacaoInvalidaError);
  });
});

describe('Anotacao', () => {
  it('cria com conteúdo aparado e atualizadoEm = criadoEm', () => {
    const a = Anotacao.nova(
      idAnotacao(1),
      ref('Jo 3:16'),
      idDestaque(2),
      '  Olá  ',
      'INLINE',
      agora,
    );
    expect(a.conteudo).toBe('Olá');
    expect(a.destaqueId).toBe(idDestaque(2));
    expect(a.exibicao).toBe('INLINE');
    expect(a.atualizadoEm).toEqual(a.criadoEm);
  });

  it.each([
    ['vazia (A3)', '   \n '],
    ['acima do limite', 'x'.repeat(TAMANHO_MAXIMO_ANOTACAO + 1)],
  ])('rejeita nota %s', (_caso, conteudo) => {
    expect(() =>
      Anotacao.nova(idAnotacao(1), ref('Jo 3:16'), null, conteudo, 'RODAPE', agora),
    ).toThrow(AnotacaoInvalidaError);
  });

  it('exige versículo e datas coerentes', () => {
    expect(() => Anotacao.nova(idAnotacao(1), ref('Jo 3'), null, 'x', 'RODAPE', agora)).toThrow(
      AnotacaoInvalidaError,
    );
    expect(() =>
      Anotacao.reconstituir(
        idAnotacao(1),
        ref('Jo 3:16'),
        null,
        'x',
        'RODAPE',
        agora,
        new Date('2026-11-21T00:00:00Z'),
      ),
    ).toThrow(AnotacaoInvalidaError);
  });

  it('edita conteúdo e modo, mantendo id, vínculo e criação (A1)', () => {
    const a = anotacao(1, 'Jo 3:16', { destaque: idDestaque(3) });
    const editada = a.editar(' Nova ', 'INLINE', agora);
    expect([editada.id, editada.destaqueId, editada.criadoEm]).toEqual([
      a.id,
      idDestaque(3),
      a.criadoEm,
    ]);
    expect([editada.conteudo, editada.exibicao, editada.atualizadoEm]).toEqual([
      'Nova',
      'INLINE',
      agora,
    ]);
    expect(a.conteudo).toBe('Nota 1');
    expect(() => a.editar('', 'RODAPE', agora)).toThrow(AnotacaoInvalidaError);
  });

  it('troca o destaque sem contar como edição', () => {
    const a = anotacao(1, 'Jo 3:16', { destaque: idDestaque(3) });
    const religada = a.comDestaque(idDestaque(4));
    expect(religada.destaqueId).toBe(idDestaque(4));
    expect(religada.atualizadoEm).toEqual(a.atualizadoEm);
    expect(a.comDestaque(null).destaqueId).toBeNull();
  });
});
