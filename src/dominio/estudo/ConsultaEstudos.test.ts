import { describe, expect, it } from 'vitest';
import { anotacao } from '../../test/anotacoes';
import { canon, destaque } from '../../test/destaques';
import { CodigoLivro, Referencia } from '../biblia';
import {
  ConsultaEstudos,
  ConsultaEstudosInvalidaError,
  dataDaMarcacao,
  referenciaDaMarcacao,
  type MarcacaoEstudo,
} from './ConsultaEstudos';
import { Favorito, FavoritoId } from './Favorito';

const favorito = (n: number, versiculo: string, minuto = n): MarcacaoEstudo => ({
  tipo: 'FAVORITO',
  favorito: Favorito.criar(
    FavoritoId.de(`00000000-0000-7000-8000-00000000f${String(n).padStart(3, '0')}`),
    Referencia.parse(versiculo, canon),
    new Date(Date.UTC(2026, 10, 22, 9, minuto)),
  ),
});
const chave = (m: MarcacaoEstudo) => referenciaDaMarcacao(m).chave();

describe('ConsultaEstudos (UC13)', () => {
  it('padrões: aba Favoritos, ordem bíblica, página 1 de 20 itens', () => {
    const c = ConsultaEstudos.criar();
    expect([c.aba, c.ordem, c.pagina, c.tamanhoPagina, c.livro]).toEqual([
      'FAVORITOS',
      'BIBLICA',
      1,
      20,
      null,
    ]);
    expect(c.filtraTexto).toBe(false);
  });

  it('rejeita página e tamanho inválidos', () => {
    expect(() => ConsultaEstudos.criar({ pagina: 0 })).toThrow(ConsultaEstudosInvalidaError);
    expect(() => ConsultaEstudos.criar({ tamanhoPagina: 1.5 })).toThrow(
      ConsultaEstudosInvalidaError,
    );
  });

  it('ordem bíblica: livro, capítulo, versículo e, nos destaques, o offset (RF09.3)', () => {
    const c = ConsultaEstudos.criar();
    const itens = [favorito(1, 'Jo 3:16'), favorito(2, 'Gn 1:1'), favorito(3, 'Jo 3:2')];
    expect(itens.sort((a, b) => c.comparar(a, b, canon)).map(chave)).toEqual([
      'GEN.1.1',
      'JHN.3.2',
      'JHN.3.16',
    ]);

    const d1: MarcacaoEstudo = { tipo: 'DESTAQUE', destaque: destaque(1, '1:8-1:11') };
    const d2: MarcacaoEstudo = { tipo: 'DESTAQUE', destaque: destaque(2, '1:0-1:3') };
    expect([d1, d2].sort((a, b) => c.comparar(a, b, canon))).toEqual([d2, d1]);
  });

  it('ordem por data: mais recentes primeiro; nas notas vale a última edição', () => {
    const c = ConsultaEstudos.criar({ ordem: 'RECENTES' });
    const itens = [
      favorito(1, 'Gn 1:1', 5),
      favorito(2, 'Jo 3:16', 30),
      favorito(3, 'Sl 23:1', 10),
    ];
    expect(itens.sort((a, b) => c.comparar(a, b, canon)).map(chave)).toEqual([
      'JHN.3.16',
      'PSA.23.1',
      'GEN.1.1',
    ]);

    const nota = anotacao(1, 'Jo 3:16');
    const editada = nota.editar('Outra', 'RODAPE', new Date(Date.UTC(2026, 10, 23)));
    expect(dataDaMarcacao({ tipo: 'ANOTACAO', anotacao: editada })).toEqual(editada.atualizadoEm);
  });

  it('filtra por livro (RF09.2)', () => {
    const c = ConsultaEstudos.criar({ livro: CodigoLivro.de('JHN') });
    expect(c.doLivro(favorito(1, 'Jo 3:16'))).toBe(true);
    expect(c.doLivro(favorito(2, 'Gn 1:1'))).toBe(false);
    const d: MarcacaoEstudo = { tipo: 'DESTAQUE', destaque: destaque(1, '1:0-1:3') };
    expect(c.doLivro(d)).toBe(true);
  });

  it('filtra pelo texto sem acentos, com todas as palavras em qualquer ordem (RF09.2)', () => {
    const c = ConsultaEstudos.criar({ texto: '  Deus  AMOU ' });
    const f = favorito(1, 'Jo 3:16');
    expect(c.correspondeTexto(f, 'Porque Deus amou o mundo')).toBe(true);
    expect(c.correspondeTexto(f, 'amou… Deus')).toBe(true);
    expect(c.correspondeTexto(f, 'Porque Deus é amor')).toBe(false);
    expect(ConsultaEstudos.criar({ texto: 'graca' }).correspondeTexto(f, 'Graças')).toBe(true);
    expect(ConsultaEstudos.criar({ texto: '  ' }).correspondeTexto(f, '')).toBe(true);
  });

  it('nas anotações, o filtro procura também no conteúdo da nota (RF02.9)', () => {
    const c = ConsultaEstudos.criar({ texto: 'unigênito síntese' });
    const nota: MarcacaoEstudo = {
      tipo: 'ANOTACAO',
      anotacao: anotacao(1, 'Jo 3:16', { conteudo: 'O versículo-síntese' }),
    };
    expect(c.correspondeTexto(nota, 'deu o seu Filho unigênito')).toBe(true);
    expect(c.correspondeTexto(favorito(1, 'Jo 3:16'), 'deu o seu Filho unigênito')).toBe(false);
  });
});
