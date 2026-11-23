import { beforeEach, describe, expect, it } from 'vitest';
import { CodigoLivro, Referencia } from '../../dominio/biblia';
import { AnotacaoInvalidaError } from '../../dominio/estudo';
import { anotacao, idAnotacao } from '../../test/anotacoes';
import { BLIVRE, TEXTOS_JO3, canon, destaque, idDestaque, intervalo } from '../../test/destaques';
import {
  AnotacoesEmMemoria,
  DestaquesEmMemoria,
  GeradorIdSequencial,
  RelogioFixo,
  TextoBiblicoEmMemoria,
} from '../../test/fakes';
import { CriarAnotacao } from './CriarAnotacao';
import { AnotacaoInexistenteError, EditarAnotacao } from './EditarAnotacao';
import { ExcluirAnotacao } from './ExcluirAnotacao';
import { MarcarTexto } from './MarcarTexto';

const ref = (t: string) => Referencia.parse(t, canon);
let repo: AnotacoesEmMemoria;
const relogio = new RelogioFixo(new Date('2026-11-23T08:00:00Z'));

beforeEach(() => {
  repo = new AnotacoesEmMemoria();
});

describe('CriarAnotacao (UC06)', () => {
  it('cria nota no versículo ou no destaque', async () => {
    const uc = new CriarAnotacao(repo, relogio, new GeradorIdSequencial());
    const noVersiculo = await uc.executar(
      { versiculo: ref('Jo 3:16'), destaque: null },
      ' Deus amou ',
      'RODAPE',
    );
    const noDestaque = await uc.executar(
      { versiculo: ref('Jo 3:1'), destaque: idDestaque(1) },
      'Trecho',
      'INLINE',
    );
    expect(noVersiculo.conteudo).toBe('Deus amou');
    expect(noVersiculo.criadoEm).toEqual(relogio.agora());
    expect(noDestaque.destaqueId).toBe(idDestaque(1));
    expect(repo.itens.size).toBe(2);
  });

  it('não salva nota vazia (A3)', async () => {
    const uc = new CriarAnotacao(repo, relogio, new GeradorIdSequencial());
    await expect(
      uc.executar({ versiculo: ref('Jo 3:16'), destaque: null }, '  ', 'RODAPE'),
    ).rejects.toThrow(AnotacaoInvalidaError);
    expect(repo.itens.size).toBe(0);
  });
});

describe('EditarAnotacao (UC06 A1)', () => {
  it('atualiza conteúdo, modo e atualizadoEm', async () => {
    await repo.salvar(anotacao(1, 'Jo 3:16'));
    const editada = await new EditarAnotacao(repo, relogio).executar(
      idAnotacao(1),
      'Outra',
      'INLINE',
    );
    expect(repo.itens.get(idAnotacao(1))).toBe(editada);
    expect([editada.conteudo, editada.exibicao, editada.atualizadoEm]).toEqual([
      'Outra',
      'INLINE',
      relogio.agora(),
    ]);
  });

  it('falha para anotação inexistente', async () => {
    await expect(
      new EditarAnotacao(repo, relogio).executar(idAnotacao(9), 'x', 'RODAPE'),
    ).rejects.toThrow(AnotacaoInexistenteError);
  });
});

describe('ExcluirAnotacao (UC06 A2)', () => {
  it('remove a anotação', async () => {
    await repo.salvar(anotacao(1, 'Jo 3:16'));
    await new ExcluirAnotacao(repo).executar(idAnotacao(1));
    expect(repo.itens.size).toBe(0);
  });
});

describe('Fusão de destaques com anotações', () => {
  it('passa as notas do destaque que sumiu para o que ficou', async () => {
    const texto = new TextoBiblicoEmMemoria(canon);
    const joao = canon.livro(CodigoLivro.de('JHN'));
    await texto.importar(BLIVRE, [
      {
        livro: joao.codigo,
        capitulos: Array.from({ length: joao.totalCapitulos }, (_, i) =>
          i === 2 ? TEXTOS_JO3 : [[1, 'x'] as const],
        ),
      },
    ]);
    const destaques = new DestaquesEmMemoria(repo);
    await destaques.aplicar({
      salvar: [destaque(1, '1:0-1:3'), destaque(2, '1:8-1:11')],
      remover: [],
    });
    await repo.salvar(anotacao(1, 'Jo 3:1', { destaque: idDestaque(2) }));

    // marca "bbb" (1:4-1:7), unindo os dois amarelos: fica o 1 (mais antigo)
    await new MarcarTexto(texto, destaques, relogio, new GeradorIdSequencial(500)).executar(
      BLIVRE,
      intervalo('1:4-1:7'),
      'AMARELO',
    );
    expect([...destaques.itens.keys()]).toEqual([idDestaque(1)]);
    expect(repo.itens.get(idAnotacao(1))?.destaqueId).toBe(idDestaque(1));
  });
});
