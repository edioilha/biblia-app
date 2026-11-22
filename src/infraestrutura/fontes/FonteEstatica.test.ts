import { describe, expect, it, vi } from 'vitest';
import { CodigoLivro, VersaoId } from '../../dominio/biblia';
import { FonteEstatica, FonteIndisponivelError } from './FonteEstatica';

const blivre = VersaoId.de('BLIVRE');
const judas = CodigoLivro.de('JUD');
const resposta = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status });

describe('FonteEstatica', () => {
  it('busca o livro relativo ao base da aplicação', async () => {
    const buscar = vi.fn<typeof fetch>(async () =>
      resposta({ formato: 1, livro: 'JUD', capitulos: [[[1, 'Judas, servo']]] }),
    );
    const livro = await new FonteEstatica('/biblia-app/', buscar).carregarLivro(blivre, judas);

    expect(buscar).toHaveBeenCalledWith('/biblia-app/dados/BLIVRE/JUD.json');
    expect(livro.livro.valor).toBe('JUD');
    expect(livro.capitulos).toEqual([[[1, 'Judas, servo']]]);
  });

  it('falha com HTTP de erro ou formato não suportado', async () => {
    const http404 = new FonteEstatica('/', async () => resposta({}, 404));
    await expect(http404.carregarLivro(blivre, judas)).rejects.toThrow(FonteIndisponivelError);

    const formato2 = new FonteEstatica('/', async () =>
      resposta({ formato: 2, livro: 'JUD', capitulos: [] }),
    );
    await expect(formato2.carregarLivro(blivre, judas)).rejects.toThrow(/formato 2/);
  });
});
