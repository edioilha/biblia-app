import { describe, expect, it, vi } from 'vitest';
import { Canon, CodigoLivro, VersaoId } from '../../dominio/biblia';
import { FonteBibliaData, URL_BIBLIA_DATA } from './FonteBibliaData';
import { FonteIndisponivelError } from './FonteEstatica';
import { VersaoCorrompidaError } from '../../aplicacao/casos-de-uso';

const canon = new Canon();
const tb = VersaoId.de('TB');
const judas = CodigoLivro.de('JUD');
const resposta = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status });
const judasOrigem = (texto: string) => ({
  id: 65,
  code: 'JUD',
  name: 'Judas',
  abbrev: 'Jd',
  chapters: [{ number: 1, verses: [{ number: 1, text: texto }] }],
});

describe('FonteBibliaData', () => {
  it('baixa o livro do biblia.data e normaliza o texto', async () => {
    const buscar = vi.fn<typeof fetch>(async () => resposta(judasOrigem('Judas,servo  ')));
    const livro = await new FonteBibliaData(canon, URL_BIBLIA_DATA, buscar).carregarLivro(
      tb,
      judas,
    );

    expect(buscar.mock.calls[0]?.[0]).toBe(`${URL_BIBLIA_DATA}TB/JUD.json`);
    expect(livro.livro.valor).toBe('JUD');
    expect(livro.capitulos).toEqual([[[1, 'Judas, servo']]]);
  });

  it('repassa o sinal de cancelamento ao fetch', async () => {
    const buscar = vi.fn<typeof fetch>(async () => resposta(judasOrigem('x')));
    const controle = new AbortController();
    await new FonteBibliaData(canon, '/', buscar).carregarLivro(tb, judas, controle.signal);
    expect(buscar.mock.calls[0]?.[1]).toEqual({ signal: controle.signal });
  });

  it('falha com HTTP de erro ou dados fora do cânon', async () => {
    const http404 = new FonteBibliaData(canon, '/', async () => resposta({}, 404));
    await expect(http404.carregarLivro(tb, judas)).rejects.toThrow(FonteIndisponivelError);

    const doisCapitulos = { ...judasOrigem('x'), chapters: [] };
    const invalida = new FonteBibliaData(canon, '/', async () => resposta(doisCapitulos));
    await expect(invalida.carregarLivro(tb, judas)).rejects.toThrow(VersaoCorrompidaError);

    const quebrado = new FonteBibliaData(canon, '/', async () => new Response('{"id":'));
    await expect(quebrado.carregarLivro(tb, judas)).rejects.toThrow(VersaoCorrompidaError);
  });
});
