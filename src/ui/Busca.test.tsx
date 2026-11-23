import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BuscaEmMemoria } from '../test/busca';
import { renderizarApp } from '../test/renderizarApp';

// Busca com o motor real sobre GEN, PSA, JHN, ROM e 1JN da Bíblia Livre (src/test/busca.ts).
const campo = () => screen.findByRole('searchbox', { name: 'Buscar na Bíblia' });
const status = () => screen.getByRole('status');
const resultados = () => screen.getByRole('list', { name: 'Versículos encontrados' });
const itens = () => within(resultados()).getAllByRole('link');

describe('Busca (UC03)', () => {
  it('busca enquanto digita, com debounce, ignorando acentos (RF02.2, RF02.6)', async () => {
    const user = userEvent.setup();
    const { busca } = renderizarApp({ rota: '/buscar' });
    await user.type(await campo(), 'unigenito');

    await waitFor(() => expect(status()).toHaveTextContent(/versículos? encontrados?/));
    expect(busca.consultas.map((c) => c.termo)).toEqual(['unigenito']); // uma busca só
    const joao316 = itens().find((l) => l.textContent?.startsWith('João 3:16'));
    if (!joao316) throw new Error('João 3:16 não encontrado');
    expect(joao316).toHaveAttribute('href', '/ler/JHN/3/16');
    expect(within(joao316).getByText('unigênito').tagName).toBe('MARK');
  });

  it('o estado fica na URL: abrir o link restaura termo, filtro e página', async () => {
    renderizarApp({ rota: '/buscar?q=deus&t=NT&p=2&n=10' });
    expect(await campo()).toHaveValue('deus');
    await waitFor(() => expect(status()).toHaveTextContent(/página 2 de \d+/));
    expect(screen.getByRole('radio', { name: /Novo Testamento/ })).toBeChecked();
    expect(itens()).toHaveLength(10);
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(itens().every((l) => /^(João|Romanos|1 João)/u.test(l.textContent ?? ''))).toBe(true);
  });

  it('frase exata por aspas e pelo chip (A1)', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/buscar' });
    await user.type(await campo(), '"amor de Deus"');
    await waitFor(() => expect(status()).toHaveTextContent(/encontrado/));
    expect(screen.getByRole('radio', { name: /Frase exata/ })).toBeChecked();
    for (const item of itens()) {
      const marcas = item.querySelectorAll('mark');
      expect([...marcas].every((m) => /^amor de Deus$/iu.test(m.textContent ?? ''))).toBe(true);
    }
    const frase = status().textContent;

    // Outro modo: as aspas saem do termo.
    await user.click(screen.getByRole('radio', { name: 'Todas as palavras' }));
    expect(await campo()).toHaveValue('amor de Deus');
    await waitFor(() => expect(status().textContent).not.toBe(frase));
  });

  it('filtra por livros no diálogo e pagina (RF02.5, RF02.7)', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/buscar?q=luz' });
    await waitFor(() => expect(status()).toHaveTextContent(/encontrados/));

    await user.click(screen.getByRole('button', { name: /^Livros: todos/ }));
    const dialogo = screen.getByRole('dialog', { name: 'Buscar nos livros' });
    await user.click(within(dialogo).getByRole('checkbox', { name: 'Salmos' }));
    await user.click(within(dialogo).getByRole('button', { name: 'Aplicar' }));
    expect(screen.getByRole('button', { name: /^Livros: Salmos/ })).toBeInTheDocument();
    await waitFor(() =>
      expect(itens().every((l) => l.textContent?.startsWith('Salmos'))).toBe(true),
    );

    await user.click(screen.getByRole('button', { name: 'Próxima página' }));
    await waitFor(() => expect(status()).toHaveTextContent('página 2'));
    expect(screen.getByRole('heading', { name: /Resultados/ })).toHaveFocus();
  });

  it('sem resultados sugere a busca aproximada (A3, A4)', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/buscar?q=unigenyto' });
    await waitFor(() =>
      expect(status()).toHaveTextContent('Nenhum versículo encontrado para “unigenyto”.'),
    );
    await user.click(screen.getByRole('button', { name: 'Buscar resultados aproximados' }));
    await waitFor(() => expect(status()).toHaveTextContent(/encontrado/));
    expect(screen.getByRole('checkbox', { name: /Aproximada/ })).toBeChecked();
    expect(itens().some((l) => l.textContent?.startsWith('João 3:16'))).toBe(true);
  });

  it('termo curto não busca; enquanto o índice prepara, avisa', async () => {
    const user = userEvent.setup();
    const busca = new BuscaEmMemoria(undefined, { segurar: true });
    renderizarApp({ rota: '/buscar', busca });
    await user.type(await campo(), 'a');
    await waitFor(() => expect(status()).toHaveTextContent('Digite ao menos 2 letras ou números.'));
    await user.type(await campo(), 'mor');
    await waitFor(() => expect(status()).toHaveTextContent('Preparando a busca…'));
    act(() => busca.liberar());
    await waitFor(() => expect(status()).toHaveTextContent(/encontrados/));
    expect(busca.consultas.map((c) => c.termo)).toEqual(['amor']);
  });

  it('o campo acompanha a URL quando ela muda por fora (link "Buscar")', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/buscar?q=luz' });
    expect(await campo()).toHaveValue('luz');
    await waitFor(() => expect(status()).toHaveTextContent(/encontrados/));
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    await user.click(within(nav).getByRole('link', { name: 'Buscar' }));
    await waitFor(async () => expect(await campo()).toHaveValue(''));
    // Depois do debounce o termo antigo não volta.
    await new Promise((r) => setTimeout(r, 400));
    expect(await campo()).toHaveValue('');
    expect(screen.getByText(/Busque palavras em toda a Bíblia/)).toBeInTheDocument();
  });

  it('"Buscar" na barra superior leva à busca e fica marcado', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/JHN/3' });
    await screen.findByRole('heading', { level: 1, name: /João/ });
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'Ler' })).toHaveAttribute('aria-current', 'page');
    await user.click(within(nav).getByRole('link', { name: 'Buscar' }));
    expect(await campo()).toBeInTheDocument();
    const navBusca = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(navBusca).getByRole('link', { name: 'Buscar' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('leva o termo para as anotações em Meus Estudos (RF02.9)', async () => {
    renderizarApp({ rota: '/buscar?q=luz' });
    await waitFor(() => expect(status()).toHaveTextContent(/encontrados/));
    expect(
      screen.getByRole('link', { name: 'Procurar “luz” nas minhas anotações' }),
    ).toHaveAttribute('href', '/estudos?aba=anotacoes&q=luz');
  });
});
