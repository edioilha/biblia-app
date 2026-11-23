import { beforeEach, describe, expect, it } from 'vitest';
import { CodigoLivro, VersaoId } from '../../dominio/biblia';
import type { Destaque } from '../../dominio/estudo';
import {
  BLIVRE,
  TEXTOS_JO3,
  canon,
  destaque,
  idDestaque,
  intervalo,
  notacao,
} from '../../test/destaques';
import {
  DestaquesEmMemoria,
  GeradorIdSequencial,
  RelogioFixo,
  TextoBiblicoEmMemoria,
} from '../../test/fakes';
import { CapituloIndisponivelError } from './AbrirCapitulo';
import { AlterarCorDestaque, DestaqueInexistenteError } from './AlterarCorDestaque';
import { DesmarcarTexto } from './DesmarcarTexto';
import { MarcarTexto, TrechoSemTextoError } from './MarcarTexto';
import { RemoverDestaque } from './RemoverDestaque';

// Jo 3:1 "aaa bbb ccc ddd" · 3:2 "eee fff ggg" · 3:3 "hhh iii"
let texto: TextoBiblicoEmMemoria;
let repo: DestaquesEmMemoria;
let gerador: GeradorIdSequencial;

beforeEach(async () => {
  texto = new TextoBiblicoEmMemoria(canon);
  const joao = canon.livro(CodigoLivro.de('JHN'));
  const capitulos = Array.from({ length: joao.totalCapitulos }, () => [[1, 'x']] as const);
  await texto.importar(BLIVRE, [
    { livro: joao.codigo, capitulos: capitulos.map((c, i) => (i === 2 ? TEXTOS_JO3 : c)) },
  ]);
  repo = new DestaquesEmMemoria();
  gerador = new GeradorIdSequencial(1000);
});

const resumo = (lista: Iterable<Destaque>) =>
  [...lista].map((d) => `${d.cor} ${notacao(d.intervalo)}`).sort();
/** Depois das datas dos destaques do fixture (2026-11-22 10:0n). */
const relogio = new RelogioFixo(new Date('2026-11-23T08:00:00Z'));
const marcar = () => new MarcarTexto(texto, repo, relogio, gerador);

describe('MarcarTexto (UC05)', () => {
  it('cria o destaque ajustado a palavras inteiras, na cor pedida', async () => {
    const d = await marcar().executar(BLIVRE, intervalo('1:5-2:1'), 'AMARELO');
    expect(notacao(d.intervalo)).toBe('1:4-2:3');
    expect(d.id).toBe('00000000-0000-7000-8000-000000001000');
    expect(d.criadoEm).toEqual(relogio.agora());
    expect(resumo(repo.itens.values())).toEqual(['AMARELO 1:4-2:3']);
  });

  it('funde com a mesma cor e corta outra cor numa única gravação', async () => {
    await repo.aplicar({
      salvar: [destaque(1, '1:0-1:3'), destaque(2, '1:12-2:3', 'ROSA')],
      remover: [],
    });
    repo.aplicacoes = 0;
    const d = await marcar().executar(BLIVRE, intervalo('1:4-1:15'), 'AMARELO');
    expect(d.id).toBe(idDestaque(1));
    expect(resumo(repo.itens.values())).toEqual(['AMARELO 1:0-1:15', 'ROSA 2:0-2:3']);
    expect(repo.aplicacoes).toBe(1);
  });

  it('rejeita seleção só de espaços', async () => {
    await expect(marcar().executar(BLIVRE, intervalo('1:3-1:4'), 'AMARELO')).rejects.toThrow(
      TrechoSemTextoError,
    );
  });

  it('falha se o capítulo não está na versão', async () => {
    await expect(
      marcar().executar(VersaoId.de('ARC'), intervalo('1:0-1:3'), 'AMARELO'),
    ).rejects.toThrow(CapituloIndisponivelError);
  });
});

describe('DesmarcarTexto (UC05 A2)', () => {
  it('apaga exatamente o trecho, sem ajustar a palavras', async () => {
    await repo.aplicar({ salvar: [destaque(1, '1:0-1:15')], remover: [] });
    const uc = new DesmarcarTexto(texto, repo, gerador);
    expect(await uc.executar(BLIVRE, intervalo('1:5-1:9'))).toBe(true);
    expect(resumo(repo.itens.values())).toEqual(['AMARELO 1:0-1:5', 'AMARELO 1:9-1:15']);
  });

  it('não grava nada quando não há destaque no trecho', async () => {
    const uc = new DesmarcarTexto(texto, repo, gerador);
    expect(await uc.executar(BLIVRE, intervalo('2:0-2:11'))).toBe(false);
    expect(repo.aplicacoes).toBe(0);
  });
});

describe('RemoverDestaque (UC05 A2)', () => {
  it('remove o destaque inteiro', async () => {
    await repo.aplicar({ salvar: [destaque(1, '1:0-2:3')], remover: [] });
    await new RemoverDestaque(repo).executar(idDestaque(1));
    expect(repo.itens.size).toBe(0);
  });
});

describe('AlterarCorDestaque', () => {
  it('troca a cor e funde com vizinhos da nova cor', async () => {
    await repo.aplicar({
      salvar: [destaque(1, '1:0-1:3', 'VERDE'), destaque(2, '1:4-1:7')],
      remover: [],
    });
    const d = await new AlterarCorDestaque(texto, repo, gerador).executar(idDestaque(2), 'VERDE');
    expect(d.id).toBe(idDestaque(1));
    expect(resumo(repo.itens.values())).toEqual(['VERDE 1:0-1:7']);
  });

  it('não grava se a cor é a mesma', async () => {
    await repo.aplicar({ salvar: [destaque(1, '1:0-1:3')], remover: [] });
    repo.aplicacoes = 0;
    await new AlterarCorDestaque(texto, repo, gerador).executar(idDestaque(1), 'AMARELO');
    expect(repo.aplicacoes).toBe(0);
  });

  it('falha para destaque inexistente', async () => {
    await expect(
      new AlterarCorDestaque(texto, repo, gerador).executar(idDestaque(9), 'ROSA'),
    ).rejects.toThrow(DestaqueInexistenteError);
  });
});
