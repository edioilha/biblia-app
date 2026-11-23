import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { notacao } from '../test/destaques';
import { DestaquesEmMemoria } from '../test/fakes';
import { renderizarApp } from '../test/renderizarApp';

// Textos sintéticos: "JHN 3:<n>" (fakes.livroSintetico).
const titulo = () => screen.findByRole('heading', { level: 1 });
const textoDo = (n: number) => {
  const el = document.querySelector(`[data-texto-versiculo="${n}"]`);
  if (!el) throw new Error(`versículo ${n}`);
  return el;
};
const primeiroTexto = (el: Node): Text => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const n = walker.nextNode();
  if (!(n instanceof Text)) throw new Error('sem texto');
  return n;
};

/** Seleciona do offset `de` do v.`a` ao offset `ate` do v.`b` (texto ainda sem marcas). */
function selecionar(a: number, de: number, b: number, ate: number) {
  act(() => {
    const r = document.createRange();
    r.setStart(primeiroTexto(textoDo(a)), de);
    r.setEnd(primeiroTexto(textoDo(b)), ate);
    const s = document.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  });
}

const barraSelecao = () => screen.getByRole('region', { name: 'Marcar trecho selecionado' });
const marcas = () => [...document.querySelectorAll('mark.marca-texto')];
const resumo = (d: DestaquesEmMemoria) =>
  [...d.itens.values()].map((x) => `${x.cor} ${notacao(x.intervalo)}`);

describe('Marca-texto (UC05)', () => {
  it('seleciona, marca em amarelo (ajustando a palavras) e avisa', async () => {
    const user = userEvent.setup();
    const { destaques } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();

    selecionar(1, 1, 1, 2); // "H" de "JHN"
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Marcar em amarelo' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Trecho marcado em amarelo.');
    expect(resumo(destaques)).toEqual(['AMARELO 1:0-1:3']);
    await waitFor(() => expect(marcas().map((m) => m.textContent)).toEqual(['JHN']));
    expect(marcas()[0]).toHaveAttribute('data-cor', 'AMARELO');
    expect(document.getSelection()?.isCollapsed).toBe(true);
    expect(screen.queryByRole('region', { name: 'Marcar trecho selecionado' })).toBeNull();
  });

  it('marca vários versículos e cobre o espaço entre eles', async () => {
    const user = userEvent.setup();
    const { destaques } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();

    selecionar(1, 4, 2, 3);
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Marcar em verde' }));

    await waitFor(() => expect(marcas().map((m) => m.textContent)).toEqual(['3:1', ' ', 'JHN']));
    expect(resumo(destaques)).toEqual(['VERDE 1:4-2:3']);
  });

  it('não mostra a barra quando a seleção não tem texto bíblico', async () => {
    renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    act(() => {
      const r = document.createRange();
      r.selectNodeContents(screen.getByRole('button', { name: 'Versículo 2' }));
      document.getSelection()?.addRange(r);
      document.dispatchEvent(new Event('selectionchange'));
    });
    expect(screen.queryByRole('region', { name: 'Marcar trecho selecionado' })).toBeNull();
  });

  it('cancela a seleção pelo ✕ ou com Esc', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();

    selecionar(1, 0, 1, 3);
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Cancelar seleção' }));
    expect(screen.queryByRole('region', { name: 'Marcar trecho selecionado' })).toBeNull();
    expect(document.getSelection()?.isCollapsed).toBe(true);

    selecionar(1, 0, 1, 3);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Marcar trecho selecionado' })).toBeNull();
  });

  it('tocar num destaque permite trocar a cor e remover (A2)', async () => {
    const user = userEvent.setup();
    const { destaques } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    selecionar(2, 0, 2, 3);
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Marcar em amarelo' }));
    await waitFor(() => expect(marcas()).toHaveLength(1));

    await user.click(marcas()[0] as Element);
    const barra = screen.getByRole('region', { name: 'Destaque em João 3:2' });
    expect(within(barra).getByRole('button', { name: 'Amarelo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(marcas()[0]).toHaveClass('marca-texto-ativa');
    await user.click(within(barra).getByRole('button', { name: 'Rosa' }));
    await waitFor(() => expect(marcas()[0]).toHaveAttribute('data-cor', 'ROSA'));
    expect(screen.getByRole('status')).toHaveTextContent('Destaque alterado para rosa.');

    await user.click(marcas()[0] as Element);
    await user.click(
      within(screen.getByRole('region', { name: /^Destaque em/ })).getByRole('button', {
        name: 'Remover',
      }),
    );
    await waitFor(() => expect(marcas()).toHaveLength(0));
    expect(destaques.itens.size).toBe(0);
  });

  it('desmarca só o trecho selecionado (borracha)', async () => {
    const user = userEvent.setup();
    const { destaques } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    selecionar(1, 0, 2, 7);
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Marcar em azul' }));
    await waitFor(() => expect(marcas().length).toBeGreaterThan(0));

    // "JHN 3:2" do v.2 está todo marcado; seleciona "3:2" dentro do <mark>.
    act(() => {
      const t = primeiroTexto(textoDo(2));
      const r = document.createRange();
      r.setStart(t, 4);
      r.setEnd(t, 7);
      document.getSelection()?.removeAllRanges();
      document.getSelection()?.addRange(r);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Desmarcar' }));

    await waitFor(() => expect(resumo(destaques)).toEqual(['AZUL 1:0-2:3']));
    expect(screen.getByRole('status')).toHaveTextContent('Marcação removida do trecho.');
  });

  it('remove a marcação pela barra do versículo, só pelo teclado', async () => {
    const user = userEvent.setup();
    const { destaques } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    selecionar(1, 0, 2, 3);
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Marcar em amarelo' }));
    await waitFor(() => expect(marcas().length).toBeGreaterThan(0));

    screen.getByRole('button', { name: 'Versículo 3' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('button', { name: 'Remover marcação' })).toBeNull();
    await user.keyboard('{Escape}');

    screen.getByRole('button', { name: 'Versículo 2' }).focus();
    await user.keyboard('{Enter}');
    await user.tab(); // Anotar
    await user.tab();
    expect(screen.getByRole('button', { name: 'Remover marcação' })).toHaveFocus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(resumo(destaques)).toEqual(['AMARELO 1:0-1:7']));
    expect(screen.getByRole('status')).toHaveTextContent('Marcação removida de João 3:2.');
  });

  it('avisa quando a gravação falha', async () => {
    const user = userEvent.setup();
    const destaques = new DestaquesEmMemoria();
    destaques.aplicar = () => Promise.reject(new Error('Disco cheio'));
    renderizarApp({ rota: '/ler/JHN/3', destaques });
    await titulo();

    selecionar(1, 0, 1, 3);
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Marcar em amarelo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível marcar o trecho.');
    expect(marcas()).toHaveLength(0);
  });

  it('mostra os destaques salvos ao abrir o capítulo', async () => {
    const user = userEvent.setup();
    const destaques = new DestaquesEmMemoria();
    const primeiro = renderizarApp({ rota: '/ler/JHN/3', destaques });
    await titulo();
    selecionar(3, 0, 3, 3);
    await user.click(within(barraSelecao()).getByRole('button', { name: 'Marcar em rosa' }));
    await waitFor(() => expect(destaques.itens.size).toBe(1));
    primeiro.unmount();

    renderizarApp({ rota: '/ler/JHN/3', destaques });
    await titulo();
    await waitFor(() => expect(marcas().map((m) => m.textContent)).toEqual(['JHN']));
    expect(textoDo(3)).toContainElement(marcas()[0] as HTMLElement);
  });
});
