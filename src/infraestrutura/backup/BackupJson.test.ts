import { describe, expect, it } from 'vitest';
import { BackupInvalidoError } from '../../aplicacao/casos-de-uso';
import { DadosDoLeitor } from '../../dominio/backup';
import { anotacao } from '../../test/anotacoes';
import { favorito, inscricao } from '../../test/dadosLeitor';
import { canon, destaque } from '../../test/destaques';
import { BackupJson } from './BackupJson';

const formato = new BackupJson(canon);
const exportadoEm = new Date('2026-11-24T12:00:00.000Z');
const dados: DadosDoLeitor = {
  favoritos: [favorito(1, 'Jo 3:16')],
  destaques: [destaque(1, '1:0-1:3', 'VERDE')],
  anotacoes: [anotacao(1, 'Jo 3:16', { conteudo: 'Amor de Deus' })],
  inscricoes: [inscricao(1, [1, 3])],
};

describe('BackupJson (UC11)', () => {
  it('serializa com cabeçalho e datas ISO, e lê de volta o mesmo conteúdo', () => {
    const texto = formato.serializar(dados, exportadoEm);
    const json = JSON.parse(texto);
    expect(json).toMatchObject({
      app: 'biblia-app',
      formato: 1,
      exportadoEm: '2026-11-24T12:00:00.000Z',
    });
    expect(json.favoritos[0]).toEqual({
      id: '00000000-0000-7000-8000-00000000f001',
      chave: 'JHN.3.16',
      livro: 'JHN',
      capitulo: 3,
      criadoEm: '2026-11-22T09:01:00.000Z',
    });

    const lido = formato.ler(texto);
    expect(lido.exportadoEm).toEqual(exportadoEm);
    expect(formato.serializar(lido.dados, lido.exportadoEm)).toBe(texto);
  });

  it('listas ausentes contam como vazias', () => {
    const lido = formato.ler(
      JSON.stringify({ app: 'biblia-app', formato: 1, exportadoEm: exportadoEm.toISOString() }),
    );
    expect(DadosDoLeitor.totais(lido.dados)).toEqual({
      favoritos: 0,
      destaques: 0,
      anotacoes: 0,
      inscricoes: 0,
    });
  });

  it.each([
    ['não é JSON', 'isto não é json', /JSON inválido/],
    ['é de outro app', '{"app":"outro","formato":1}', /não é um backup/],
    ['é de formato mais novo', '{"app":"biblia-app","formato":2}', /versão mais nova/],
    ['não tem data', '{"app":"biblia-app","formato":1}', /data de exportação/],
  ])('recusa arquivo que %s', (_, texto, mensagem) => {
    expect(() => formato.ler(texto)).toThrow(BackupInvalidoError);
    expect(() => formato.ler(texto)).toThrow(mensagem);
  });

  it('recusa o arquivo inteiro se um item for inválido', () => {
    const json = JSON.parse(formato.serializar(dados, exportadoEm));
    json.favoritos.push({ ...json.favoritos[0], chave: 'JHN.3' }); // capítulo, não versículo
    expect(() => formato.ler(JSON.stringify(json))).toThrow(
      /dados inválidos em favoritos \(item 2/,
    );

    const semData = JSON.parse(formato.serializar(dados, exportadoEm));
    delete semData.anotacoes[0].criadoEm;
    expect(() => formato.ler(JSON.stringify(semData))).toThrow(
      /dados inválidos em anotações \(item 1: Data da anotação inválida/,
    );
  });
});
