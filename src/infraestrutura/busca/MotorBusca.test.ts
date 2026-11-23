import { beforeAll, describe, expect, it } from 'vitest';
import { Canon, CodigoLivro, Testamento } from '../../dominio/biblia';
import { ConsultaBusca, FiltroBusca, type OpcoesConsulta } from '../../dominio/busca';
import { consultaDeDTO, consultaParaDTO, paginaDeDTO, paginaParaDTO } from './dto';
import { capitulosBLIVRE } from '../../test/busca';
import { MotorBusca } from './MotorBusca';

// Texto real da versão embarcada (alguns livros): resultados conferíveis na Bíblia Livre.
const LIVROS = ['GEN', 'PSA', 'JHN', 'ROM', '1JN'];
const canon = new Canon();
let motor: MotorBusca;

const buscar = (entrada: string, opcoes: OpcoesConsulta = {}) =>
  motor.buscar(ConsultaBusca.interpretar(entrada, opcoes));
const chaves = (entrada: string, opcoes: OpcoesConsulta = {}) =>
  buscar(entrada, { tamanhoPagina: 100, ...opcoes }).itens.map((r) => r.referencia.chave());
const destaques = (entrada: string, chave: string, opcoes: OpcoesConsulta = {}) => {
  const r = buscar(entrada, { tamanhoPagina: 100, ...opcoes }).itens.find(
    (x) => x.referencia.chave() === chave,
  );
  return r?.ocorrencias.map((o) => r.texto.slice(o.de, o.ate));
};

beforeAll(() => {
  motor = MotorBusca.construir(canon, capitulosBLIVRE(LIVROS));
});

describe('MotorBusca (ADR 0005, UC03)', () => {
  it('indexa todos os versículos', () => {
    expect(motor.totalVersiculos).toBeGreaterThan(5000);
  });

  it('ignora acentos e maiúsculas (RF02.2)', () => {
    const comAcento = buscar('coração').total;
    expect(comAcento).toBeGreaterThan(0);
    expect(buscar('CORACAO').total).toBe(comAcento);
  });

  it('todas as palavras (padrão) ⊂ qualquer palavra (RF02.3)', () => {
    const todas = buscar('amor deus').total;
    const qualquer = buscar('amor deus', { modo: 'QUALQUER_PALAVRA' }).total;
    expect(todas).toBeGreaterThan(0);
    expect(qualquer).toBeGreaterThan(todas);
  });

  it('frase exata só traz a sequência e destaca a frase inteira (A1)', () => {
    const frase = chaves('"amor de Deus"');
    expect(frase.length).toBeGreaterThan(0);
    expect(frase.length).toBeLessThan(chaves('amor de deus').length);
    expect(
      destaques('"amor de Deus"', frase[0] ?? '')?.every((t) => /^amor de Deus$/iu.test(t)),
    ).toBe(true);
  });

  it('prefixo só na última palavra, a partir de 3 letras (RF02.4)', () => {
    expect(chaves('Porque Deus amo')).toContain('JHN.3.16'); // "amou"
    expect(buscar('am').total).toBe(0); // "am" não é prefixo (< 3)
    expect(destaques('Deus amo', 'JHN.3.16')).toEqual(['Deus', 'amou']);
  });

  it('aproximada encontra erros de digitação (RF02.4, A3)', () => {
    expect(buscar('unigenyto').total).toBe(0);
    expect(chaves('unigenyto', { fuzzy: true })).toContain('JHN.3.16');
  });

  it('filtra por testamento e livros (RF02.5)', () => {
    const tudo = buscar('luz').total;
    const nt = buscar('luz', { filtro: FiltroBusca.de(Testamento.NOVO) });
    const sl = buscar('luz', {
      filtro: FiltroBusca.de(null, [canon.livro(CodigoLivro.de('PSA'))]),
    });
    expect(nt.total + buscar('luz', { filtro: FiltroBusca.de(Testamento.ANTIGO) }).total).toBe(
      tudo,
    );
    expect(nt.itens.every((r) => ['JHN', 'ROM', '1JN'].includes(r.referencia.livro.valor))).toBe(
      true,
    );
    expect(sl.itens.every((r) => r.referencia.livro.valor === 'PSA')).toBe(true);
  });

  it('pagina e ordena por relevância ou ordem canônica (RF02.7)', () => {
    const p1 = buscar('deus', { tamanhoPagina: 10 });
    const p2 = buscar('deus', { tamanhoPagina: 10, pagina: 2 });
    expect(p1.itens).toHaveLength(10);
    expect(p2.total).toBe(p1.total);
    expect(p2.itens[0]?.referencia.chave()).not.toBe(p1.itens[0]?.referencia.chave());
    expect(p1.itens[0]?.pontuacao).toBeGreaterThanOrEqual(p1.itens[9]?.pontuacao ?? 0);

    const canonica = chaves('deus', { ordenacao: 'CANONICA' }).slice(0, 3);
    expect(canonica).toEqual(['GEN.1.1', 'GEN.1.2', 'GEN.1.3']);
  });

  it('abaixo do termo mínimo devolve página vazia', () => {
    expect(buscar('a').total).toBe(0);
  });

  it('consulta e página sobrevivem ao formato do worker (DTO)', () => {
    const consulta = ConsultaBusca.interpretar('"amor de Deus"', {
      filtro: FiltroBusca.de(Testamento.NOVO, [canon.livro(CodigoLivro.de('1JN'))]),
      ordenacao: 'CANONICA',
      pagina: 1,
      tamanhoPagina: 10,
    });
    const volta = consultaDeDTO(structuredClone(consultaParaDTO(consulta)), canon);
    expect(consultaParaDTO(volta)).toEqual(consultaParaDTO(consulta));

    const pagina = motor.buscar(consulta);
    const recebida = paginaDeDTO(structuredClone(paginaParaDTO(pagina)), canon);
    expect(recebida.total).toBe(pagina.total);
    expect(recebida.itens[0]?.referencia.chave()).toBe(pagina.itens[0]?.referencia.chave());
    expect(recebida.itens[0]?.ocorrencias).toEqual(pagina.itens[0]?.ocorrencias);
  });
});
