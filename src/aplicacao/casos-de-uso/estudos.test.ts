import { beforeEach, describe, expect, it } from 'vitest';
import { CodigoLivro, Referencia, VersaoId } from '../../dominio/biblia';
import {
  ConsultaEstudos,
  Destaque,
  Favorito,
  FavoritoId,
  type ItemEstudo,
  type OpcoesConsultaEstudos,
} from '../../dominio/estudo';
import { anotacao } from '../../test/anotacoes';
import { BLIVRE, TEXTOS_JO3, canon, destaque, idDestaque, intervalo } from '../../test/destaques';
import {
  AnotacoesEmMemoria,
  DestaquesEmMemoria,
  FavoritosEmMemoria,
  TextoBiblicoEmMemoria,
  livroSintetico,
} from '../../test/fakes';
import { ListarEstudos } from './ListarEstudos';
import { RemoverFavorito } from './RemoverFavorito';

const ref = (t: string) => Referencia.parse(t, canon);
const favorito = (n: number, versiculo: string, minuto = n) =>
  Favorito.criar(
    FavoritoId.de(`00000000-0000-7000-8000-00000000f${String(n).padStart(3, '0')}`),
    ref(versiculo),
    new Date(Date.UTC(2026, 10, 22, 9, minuto)),
  );
const rotulo = (i: ItemEstudo) => {
  switch (i.tipo) {
    case 'FAVORITO':
      return i.favorito.referencia.chave();
    case 'DESTAQUE':
      return i.destaque.intervalo.inicio.versiculo.chave();
    case 'ANOTACAO':
      return i.anotacao.referencia.chave();
  }
};

describe('ListarEstudos (UC13)', () => {
  let texto: TextoBiblicoEmMemoria;
  let favoritos: FavoritosEmMemoria;
  let destaques: DestaquesEmMemoria;
  let anotacoes: AnotacoesEmMemoria;
  let uc: ListarEstudos;
  const listar = (opcoes: OpcoesConsultaEstudos = {}) =>
    uc.executar(BLIVRE, ConsultaEstudos.criar(opcoes));

  beforeEach(async () => {
    texto = new TextoBiblicoEmMemoria(canon);
    const joao = livroSintetico(canon, 'JHN', 16);
    await texto.importar(BLIVRE, [
      livroSintetico(canon, 'GEN'),
      livroSintetico(canon, 'PSA'),
      { ...joao, capitulos: joao.capitulos.map((c, i) => (i === 2 ? TEXTOS_JO3 : c)) },
    ]);
    favoritos = new FavoritosEmMemoria();
    anotacoes = new AnotacoesEmMemoria();
    destaques = new DestaquesEmMemoria(anotacoes);
    uc = new ListarEstudos(canon, texto, favoritos, destaques, anotacoes);
  });

  it('lista a aba em ordem bíblica com o texto do versículo e o total de cada aba', async () => {
    await favoritos.salvar(favorito(1, 'Jo 3:2'));
    await favoritos.salvar(favorito(2, 'Gn 1:3'));
    await destaques.aplicar({ salvar: [destaque(1, '1:4-1:11')], remover: [] });
    await anotacoes.salvar(anotacao(1, 'Sl 23:1'));

    const { pagina, totais } = await listar();
    expect(totais).toEqual({ FAVORITOS: 2, DESTAQUES: 1, ANOTACOES: 1 });
    expect(pagina.itens.map(rotulo)).toEqual(['GEN.1.3', 'JHN.3.2']);
    expect(pagina.itens.map((i) => i.texto)).toEqual(['GEN 1:3', 'eee fff ggg']);
  });

  it('destaques mostram só o trecho marcado, mesmo entre versículos (RF04.6)', async () => {
    await destaques.aplicar({ salvar: [destaque(1, '1:8-2:3', 'VERDE')], remover: [] });
    const { pagina } = await listar({ aba: 'DESTAQUES' });
    expect(pagina.itens[0]?.texto).toBe('ccc ddd eee');
  });

  it('ignora destaques de outra versão', async () => {
    const outra = Destaque.criar(
      idDestaque(2),
      VersaoId.de('ARC'),
      intervalo('1:0-1:3'),
      'AMARELO',
      new Date(),
    );
    await destaques.aplicar({ salvar: [destaque(1, '1:0-1:3'), outra], remover: [] });
    expect((await listar({ aba: 'DESTAQUES' })).totais.DESTAQUES).toBe(1);
  });

  it('anotações trazem o versículo; o filtro de texto vale para o versículo e a nota', async () => {
    await anotacoes.salvar(anotacao(1, 'Jo 3:1', { conteudo: 'Sobre **Nicodemos**' }));
    await anotacoes.salvar(anotacao(2, 'Gn 1:1', { conteudo: 'Criação' }));
    await favoritos.salvar(favorito(1, 'Jo 3:1'));

    const porNota = await listar({ aba: 'ANOTACOES', texto: 'nicodemos' });
    expect(porNota.pagina.itens.map(rotulo)).toEqual(['JHN.3.1']);
    expect(porNota.pagina.itens[0]?.texto).toBe('aaa bbb ccc ddd');
    // O favorito não tem nota: "nicodemos" não aparece no versículo.
    expect(porNota.totais).toEqual({ FAVORITOS: 0, DESTAQUES: 0, ANOTACOES: 1 });

    const porVersiculo = await listar({ aba: 'ANOTACOES', texto: 'BBB' });
    expect(porVersiculo.totais).toEqual({ FAVORITOS: 1, DESTAQUES: 0, ANOTACOES: 1 });
  });

  it('filtra por livro em todas as abas', async () => {
    await favoritos.salvar(favorito(1, 'Jo 3:1'));
    await favoritos.salvar(favorito(2, 'Gn 1:1'));
    await destaques.aplicar({ salvar: [destaque(1, '1:0-1:3')], remover: [] });
    const { pagina, totais } = await listar({ livro: CodigoLivro.de('GEN') });
    expect(totais).toEqual({ FAVORITOS: 1, DESTAQUES: 0, ANOTACOES: 0 });
    expect(pagina.itens.map(rotulo)).toEqual(['GEN.1.1']);
  });

  it('ordena pelos mais recentes (A3) e pagina (RF09.4)', async () => {
    for (let n = 1; n <= 25; n++) await favoritos.salvar(favorito(n, `Gn 1:${n}`, 60 - n));

    const p1 = await listar({ ordem: 'RECENTES' });
    expect(p1.pagina.itens).toHaveLength(20);
    expect(p1.pagina.totalPaginas()).toBe(2);
    expect(rotulo(p1.pagina.itens[0] as ItemEstudo)).toBe('GEN.1.1');

    const p2 = await listar({ ordem: 'BIBLICA', pagina: 2 });
    expect(p2.pagina.itens.map(rotulo)).toEqual([21, 22, 23, 24, 25].map((v) => `GEN.1.${v}`));
  });

  it('versículo sem texto na versão fica com texto vazio', async () => {
    await favoritos.salvar(favorito(1, 'Ap 1:1'));
    const { pagina } = await listar();
    expect(pagina.itens[0]?.texto).toBe('');
  });
});

describe('RemoverFavorito (UC13 A4)', () => {
  it('remove pelo id', async () => {
    const repo = new FavoritosEmMemoria();
    const f = favorito(1, 'Jo 3:16');
    await repo.salvar(f);
    await new RemoverFavorito(repo).executar(f.id);
    expect(repo.itens.size).toBe(0);
  });
});
