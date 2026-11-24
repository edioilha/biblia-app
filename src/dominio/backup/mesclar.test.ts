import { describe, expect, it } from 'vitest';
import { anotacao } from '../../test/anotacoes';
import { favorito, inscricao } from '../../test/dadosLeitor';
import { destaque } from '../../test/destaques';
import { DadosDoLeitor, mesclarDados } from './mesclar';

const dados = (d: Partial<DadosDoLeitor>): DadosDoLeitor => ({ ...DadosDoLeitor.vazio(), ...d });
const ids = (lista: readonly { id: string }[]) => lista.map((x) => x.id.slice(-4));

describe('mesclarDados (UC11 — importar juntando)', () => {
  it('num aparelho vazio, tudo do arquivo entra', () => {
    const arquivo = dados({
      favoritos: [favorito(1, 'Jo 3:16')],
      destaques: [destaque(1, '1:0-1:3')],
      anotacoes: [anotacao(1, 'Jo 3:16')],
      inscricoes: [inscricao(1, [1, 2])],
    });
    const { alteracoes, resumo } = mesclarDados(DadosDoLeitor.vazio(), arquivo);
    expect(DadosDoLeitor.totais(alteracoes)).toEqual(DadosDoLeitor.totais(arquivo));
    expect(resumo.favoritos).toEqual({ novos: 1, atualizados: 0, mantidos: 0 });
    expect(alteracoes.inscricoesRemovidas).toEqual([]);
  });

  it('favoritos: um por versículo; o que já existe fica', () => {
    const atuais = dados({ favoritos: [favorito(1, 'Jo 3:16')] });
    const arquivo = dados({
      favoritos: [favorito(1, 'Jo 3:16'), favorito(2, 'Jo 3:16'), favorito(3, 'Gn 1:1')],
    });
    const { alteracoes, resumo } = mesclarDados(atuais, arquivo);
    expect(ids(alteracoes.favoritos)).toEqual(['f003']);
    expect(resumo.favoritos).toEqual({ novos: 1, atualizados: 0, mantidos: 2 });
  });

  it('anotações: mesmo id fica a editada por último', () => {
    const antiga = anotacao(1, 'Jo 3:16', { conteudo: 'antiga' });
    const editada = antiga.editar('editada', 'RODAPE', new Date(Date.UTC(2026, 10, 23)));
    const outra = anotacao(2, 'Jo 3:17');

    const r1 = mesclarDados(dados({ anotacoes: [antiga] }), dados({ anotacoes: [editada, outra] }));
    expect(r1.alteracoes.anotacoes.map((a) => a.conteudo)).toEqual(['editada', 'Nota 2']);
    expect(r1.resumo.anotacoes).toEqual({ novos: 1, atualizados: 1, mantidos: 0 });

    const r2 = mesclarDados(dados({ anotacoes: [editada] }), dados({ anotacoes: [antiga] }));
    expect(r2.alteracoes.anotacoes).toEqual([]);
    expect(r2.resumo.anotacoes.mantidos).toBe(1);
  });

  it('destaques: mesmo id fica o atual; sobreposto a um existente não entra', () => {
    const atuais = dados({ destaques: [destaque(1, '1:0-1:7')] });
    const arquivo = dados({
      destaques: [
        destaque(1, '1:0-1:3', 'VERDE'), // mesmo id
        destaque(2, '1:4-1:11'), // sobrepõe o 1
        destaque(3, '2:0-2:3'), // livre
        destaque(4, '2:2-2:5'), // sobrepõe o 3, que acabou de entrar
      ],
    });
    const { alteracoes, resumo } = mesclarDados(atuais, arquivo);
    expect(ids(alteracoes.destaques)).toEqual(['0003']);
    expect(resumo.destaques).toEqual({ novos: 1, atualizados: 0, mantidos: 1, sobrepostos: 2 });
  });

  it('planos: um por plano; fica o de mais dias concluídos', () => {
    const atual = inscricao(1, [1, 2]);
    const maisAvancada = inscricao(2, [1, 2, 3]);
    const r1 = mesclarDados(dados({ inscricoes: [atual] }), dados({ inscricoes: [maisAvancada] }));
    expect(ids(r1.alteracoes.inscricoes)).toEqual(['c002']);
    expect(ids(r1.alteracoes.inscricoesRemovidas.map((id) => ({ id })))).toEqual(['c001']);
    expect(r1.resumo.inscricoes).toEqual({ novos: 0, atualizados: 1, mantidos: 0 });

    const r2 = mesclarDados(dados({ inscricoes: [maisAvancada] }), dados({ inscricoes: [atual] }));
    expect(r2.alteracoes.inscricoes).toEqual([]);
    expect(r2.resumo.inscricoes.mantidos).toBe(1);

    const outroPlano = inscricao(3, [], 'nt-90-dias');
    const r3 = mesclarDados(dados({ inscricoes: [atual] }), dados({ inscricoes: [outroPlano] }));
    expect(r3.resumo.inscricoes.novos).toBe(1);
  });
});
