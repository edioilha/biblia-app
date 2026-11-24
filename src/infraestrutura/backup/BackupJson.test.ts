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

describe('BackupJson — arquivo hostil (BL-16)', () => {
  const base = () => JSON.parse(formato.serializar(dados, exportadoEm));

  it('HTML e script nas notas continuam texto (quem exibe é o React, sem HTML cru)', () => {
    const json = base();
    json.anotacoes[0].conteudo = '<img src=x onerror="alert(1)"> [link](javascript:alert(1))';
    const [nota] = formato.ler(JSON.stringify(json)).dados.anotacoes;
    expect(nota?.conteudo).toBe('<img src=x onerror="alert(1)"> [link](javascript:alert(1))');
  });

  it('__proto__ e campos extras não contaminam objetos', () => {
    const texto = formato
      .serializar(dados, exportadoEm)
      .replace('"app": "biblia-app",', '"app": "biblia-app", "__proto__": { "poluido": true },')
      .replace(
        '"chave": "JHN.3.16",',
        '"chave": "JHN.3.16", "__proto__": { "poluido": true }, "extra": 1,',
      );
    const lido = formato.ler(texto);
    expect(lido.dados.favoritos).toHaveLength(1);
    expect(({} as Record<string, unknown>)['poluido']).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty('poluido');
  });

  it.each([
    ['favoritos', 'chave', 123],
    ['favoritos', 'chave', 'JHN.999.1'],
    ['anotacoes', 'conteudo', { texto: 'x' }],
    ['anotacoes', 'conteudo', '   '],
    ['anotacoes', 'conteudo', 'x'.repeat(10_001)],
    ['anotacoes', 'exibicao', 'POPUP'],
    ['destaques', 'cor', 'PRETO'],
    ['destaques', 'inicio', [16, -1]],
    ['destaques', 'inicio', 'abc'],
    ['destaques', 'versaoId', '../../etc'],
    ['inscricoes', 'totalDias', 1e9 + 0.5],
    ['inscricoes', 'diasConcluidos', [0]],
    ['inscricoes', 'inicio', '2026-02-30'],
  ])('recusa %s com %s = %j', (lista, campo, valor) => {
    const json = base();
    json[lista][0][campo] = valor;
    expect(() => formato.ler(JSON.stringify(json))).toThrow(BackupInvalidoError);
  });

  it.each([
    ['lista que não é lista', { favoritos: 'tudo' }],
    ['item que não é objeto', { favoritos: [42] }],
    ['item nulo', { anotacoes: [null] }],
  ])('recusa %s', (_, extra) => {
    const json = { ...base(), ...extra };
    expect(() => formato.ler(JSON.stringify(json))).toThrow(BackupInvalidoError);
  });
});
