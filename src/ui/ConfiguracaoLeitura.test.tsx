import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Referencia, VersaoId } from '../dominio/biblia';
import { ConfiguracaoLeitura, Preferencias } from '../dominio/preferencias';
import { canon } from '../test/destaques';
import { renderizarApp } from '../test/renderizarApp';

const html = document.documentElement;
afterEach(() => {
  delete html.dataset['tema'];
  html.style.removeProperty('--escala-leitura');
  localStorage.clear();
});

describe('Configurar leitura — botão "Aa" (UC12)', () => {
  it('aumenta e diminui o texto dentro dos limites e salva', async () => {
    const user = userEvent.setup();
    const { prefs } = renderizarApp({ rota: '/ler/JHN/3' });

    await user.click(await screen.findByRole('button', { name: 'Aparência da leitura' }));
    const painel = screen.getByRole('group', { name: 'Aparência da leitura' });
    expect(within(painel).getByText('3 de 7')).toBeInTheDocument();

    await user.click(within(painel).getByRole('button', { name: 'Aumentar o texto' }));
    expect(within(painel).getByText('4 de 7')).toBeInTheDocument();
    await waitFor(() => expect(prefs.atual?.leitura.tamanhoFonte).toBe(4));
    await waitFor(() => expect(html.style.getPropertyValue('--escala-leitura')).toBe('1.12'));

    for (let i = 0; i < 3; i++) {
      await user.click(within(painel).getByRole('button', { name: 'Aumentar o texto' }));
    }
    expect(within(painel).getByRole('button', { name: 'Aumentar o texto' })).toBeDisabled();
    expect(within(painel).getByText('7 de 7')).toBeInTheDocument();
  });

  it('troca o tema do app inteiro e guarda para a próxima abertura', async () => {
    const user = userEvent.setup();
    const { prefs } = renderizarApp({ rota: '/ler/JHN/3' });

    await user.click(await screen.findByRole('button', { name: 'Aparência da leitura' }));
    await user.click(screen.getByRole('radio', { name: 'Escuro' }));

    await waitFor(() => expect(html.dataset['tema']).toBe('ESCURO'));
    expect(prefs.atual?.leitura.tema).toBe('ESCURO');
    expect(JSON.parse(localStorage.getItem('biblia-app:leitura') ?? '{}')).toEqual({
      tema: 'ESCURO',
      escala: 1,
    });

    // Esc fecha e devolve o foco ao botão.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Aparência da leitura' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Aparência da leitura' })).toHaveFocus();
  });

  it('aplica a configuração salva ao abrir o app', async () => {
    renderizarApp({
      rota: '/estudos',
      preferencias: Preferencias.criar(
        VersaoId.de('BLIVRE'),
        Referencia.parse('Jo 3', canon),
        ConfiguracaoLeitura.criar('SEPIA', 2),
      ),
    });
    await waitFor(() => expect(html.dataset['tema']).toBe('SEPIA'));
    expect(html.style.getPropertyValue('--escala-leitura')).toBe('0.9');
  });
});
