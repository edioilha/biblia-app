import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { FonteVersao } from '../aplicacao/portas';
import { Canon, Referencia, VersaoId } from '../dominio/biblia';
import { Preferencias } from '../dominio/preferencias';
import { FavoritosEmMemoria, FonteSintetica } from '../test/fakes';
import { renderizarApp } from '../test/renderizarApp';

const canon = new Canon();
const titulo = () => screen.findByRole('heading', { level: 1 });
const anterior = () => screen.getByRole('button', { name: /^Capítulo anterior/ });
const proximo = () => screen.getByRole('button', { name: /^Próximo capítulo/ });
/** Elemento do versículo (com número e texto) a partir do texto dele. */
const versiculo = (texto: HTMLElement) => texto.closest<HTMLElement>('[data-ref]') ?? texto;

describe('Leitura (UC01)', () => {
  it('na primeira execução prepara a versão e abre Gênesis 1', async () => {
    const { prefs } = renderizarApp();
    expect(await titulo()).toHaveTextContent(/Gênesis\s*Capítulo 1/);
    expect(screen.getByText('GEN 1:1')).toBeInTheDocument();
    expect(document.title).toBe('Gênesis 1 · Bíblia App');
    await waitFor(() => expect(prefs.atual?.ultimaPosicao.chave()).toBe('GEN.1'));
  });

  it('reabre na última posição salva', async () => {
    renderizarApp({
      preferencias: Preferencias.criar(VersaoId.de('BLIVRE'), Referencia.parse('Rm 8', canon)),
    });
    expect(await titulo()).toHaveTextContent(/Romanos\s*Capítulo 8/);
  });

  it('navega com os botões e salva a posição', async () => {
    const user = userEvent.setup();
    const { prefs } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();

    await user.click(proximo());
    expect(await screen.findByText('JHN 4:1')).toBeInTheDocument();
    expect(prefs.atual?.ultimaPosicao.chave()).toBe('JHN.4');

    await user.click(anterior());
    expect(await screen.findByText('JHN 3:1')).toBeInTheDocument();
  });

  it('navega com as teclas ← e →, atravessando livros', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/JHN/21' });
    await screen.findByText('JHN 21:1');

    await user.keyboard('{ArrowRight}');
    expect(await screen.findByText('ACT 1:1')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(await screen.findByText('JHN 21:1')).toBeInTheDocument();
  });

  it('desabilita a navegação nos limites do cânon (A2)', async () => {
    renderizarApp({ rota: '/ler/GEN/1' });
    await titulo();
    expect(anterior()).toBeDisabled();
    expect(proximo()).toBeEnabled();
    expect(proximo()).toHaveAccessibleName('Próximo capítulo: Gênesis 2');
  });

  it('exibe número do versículo sobrescrito e destaca o versículo em foco (UC02)', async () => {
    renderizarApp({ rota: '/ler/JHN/3/2' });
    const v2 = versiculo(await screen.findByText('JHN 3:2'));
    expect(within(v2).getByRole('button', { name: 'Versículo 2' }).closest('sup')).not.toBeNull();
    expect(v2).toHaveClass('versiculo-foco');
    expect(screen.getByText('JHN 3:1')).not.toHaveClass('versiculo-foco');
  });

  it('informa referência inexistente na URL', async () => {
    renderizarApp({ rota: '/ler/JHN/99' });
    expect(await titulo()).toHaveTextContent('Referência não encontrada');
  });
});

describe('Seletor de referência (UC01 A1 · UC02)', () => {
  it('vai para a referência digitada', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/GEN/1' });
    await titulo();

    await user.click(screen.getByRole('button', { name: /Gênesis 1.*escolher livro/ }));
    await user.type(screen.getByRole('searchbox'), 'jo 3:2{Enter}');

    expect(versiculo(await screen.findByText('JHN 3:2'))).toHaveClass('versiculo-foco');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra erro para referência inválida', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/GEN/1' });
    await titulo();

    await user.click(screen.getByRole('button', { name: /escolher livro/ }));
    await user.type(screen.getByRole('searchbox'), 'jo 99{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('João tem 21 capítulo(s)');
  });

  it('escolhe livro e capítulo pelas grades, filtrando pelo texto digitado', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/GEN/1' });
    await titulo();

    await user.click(screen.getByRole('button', { name: /escolher livro/ }));
    await user.type(screen.getByRole('searchbox'), 'ro');
    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getByRole('button', { name: 'Romanos' })).toBeInTheDocument();
    expect(within(dialogo).queryByRole('button', { name: 'Gênesis' })).not.toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Romanos' }));
    await user.click(within(dialogo).getByRole('button', { name: 'Romanos 8' }));
    expect(await titulo()).toHaveTextContent(/Romanos\s*Capítulo 8/);
  });
});

describe('Favoritos (UC04)', () => {
  const numero = (n: number, favorito = false) =>
    screen.getByRole('button', { name: `Versículo ${n}${favorito ? ', favorito' : ''}` });
  const acoes = () => screen.getByRole('region', { name: /^Ações do versículo/ });

  it('favorita e desfavorita pelo número do versículo, mostrando ★ e avisando', async () => {
    const user = userEvent.setup();
    const { favoritos } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();

    await user.click(numero(2));
    expect(acoes()).toHaveAccessibleName('Ações do versículo João 3:2');
    expect(numero(2)).toHaveAttribute('aria-expanded', 'true');
    expect(versiculo(screen.getByText('JHN 3:2'))).toHaveClass('versiculo-selecionado');

    await user.click(within(acoes()).getByRole('button', { name: /Favoritar/ }));
    expect(screen.queryByRole('region', { name: /^Ações do versículo/ })).not.toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent(
      'João 3:2 adicionado aos favoritos.',
    );
    expect(numero(2, true)).toHaveTextContent('★2');
    expect([...favoritos.itens.values()].map((f) => f.referencia.chave())).toEqual(['JHN.3.2']);

    await user.click(numero(2, true));
    await user.click(within(acoes()).getByRole('button', { name: /Remover favorito/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('João 3:2 removido dos favoritos.');
    expect(numero(2)).toHaveTextContent(/^2$/);
    expect(favoritos.itens.size).toBe(0);
  });

  it('mostra os favoritos salvos ao abrir o capítulo', async () => {
    const favoritos = new FavoritosEmMemoria();
    const primeiro = renderizarApp({ rota: '/ler/JHN/3', favoritos });
    await titulo();
    const user = userEvent.setup();
    await user.click(numero(3));
    await user.click(within(acoes()).getByRole('button', { name: /Favoritar/ }));
    await screen.findByRole('button', { name: 'Versículo 3, favorito' });
    primeiro.unmount();

    renderizarApp({ rota: '/ler/JHN/3', favoritos });
    expect(
      await screen.findByRole('button', { name: 'Versículo 3, favorito' }),
    ).toBeInTheDocument();
  });

  it('funciona pelo teclado: Esc fecha e devolve o foco ao versículo', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();

    numero(1).focus();
    await user.keyboard('{Enter}');
    expect(within(acoes()).getByRole('button', { name: /Favoritar/ })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: /^Ações do versículo/ })).not.toBeInTheDocument();
    expect(numero(1)).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('button', { name: 'Versículo 1, favorito' })).toHaveFocus();
  });

  it('fecha a barra ao trocar de capítulo', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    await user.click(numero(1));
    await user.click(proximo());
    await screen.findByText('JHN 4:1');
    expect(screen.queryByRole('region', { name: /^Ações do versículo/ })).not.toBeInTheDocument();
  });

  it('desfaz a marcação otimista e avisa quando a gravação falha', async () => {
    const user = userEvent.setup();
    const favoritos = new FavoritosEmMemoria();
    favoritos.salvar = () => Promise.reject(new Error('Disco cheio'));
    renderizarApp({ rota: '/ler/JHN/3', favoritos });
    await titulo();

    await user.click(numero(2));
    await user.click(within(acoes()).getByRole('button', { name: /Favoritar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível atualizar o favorito de João 3:2.',
    );
    expect(numero(2)).toHaveTextContent(/^2$/);
  });
});

describe('Preparação da versão embarcada', () => {
  it('mostra erro e permite tentar novamente', async () => {
    const user = userEvent.setup();
    let falhar = true;
    const sintetica = new FonteSintetica(canon);
    const fonte: FonteVersao = {
      carregarLivro: async (v, l) => {
        if (falhar) throw new Error('Sem conexão');
        return sintetica.carregarLivro(v, l);
      },
    };
    renderizarApp({ fonte });

    expect(await titulo()).toHaveTextContent('Não foi possível preparar a Bíblia');
    expect(screen.getByText('Sem conexão')).toBeInTheDocument();

    falhar = false;
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await titulo()).toHaveTextContent(/Gênesis\s*Capítulo 1/);
  });
});
