import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Canon, VersaoId } from '../dominio/biblia';
import { BuscaEmMemoria } from '../test/busca';
import { FonteSintetica } from '../test/fakes';
import { renderizarApp } from '../test/renderizarApp';

const TB = VersaoId.de('TB');
const instaladas = () => screen.getByRole('group', { name: /Instaladas/ });

describe('Versões (UC09/UC10)', () => {
  it('lista a instalada (ativa, padrão, sem Remover) e as disponíveis (RF07.2)', async () => {
    renderizarApp({ rota: '/versoes' });

    const radio = await screen.findByRole('radio', { name: /BLIVRE · Bíblia Livre/ });
    expect(radio).toBeChecked();
    expect(within(instaladas()).getByText('Padrão')).toBeInTheDocument();
    expect(within(instaladas()).getByText('Ativa')).toBeInTheDocument();
    expect(within(instaladas()).queryByRole('button', { name: /Remover/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Instalar Tradução Brasileira' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Instalar Almeida 1911' })).toBeEnabled();
    expect(screen.getByText(/ortografia antiga/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Versões' })).toHaveAttribute('aria-current', 'page');
  });

  it('instala com progresso e a versão passa a instalada; a busca fica indexada (UC09)', async () => {
    const user = userEvent.setup();
    const canon = new Canon();
    const fonte = new FonteSintetica(canon, { prefixo: true });
    fonte.segurar();
    const busca = new BuscaEmMemoria();
    renderizarApp({ rota: '/versoes', fonteInstalacao: fonte, busca });

    await user.click(await screen.findByRole('button', { name: 'Instalar Tradução Brasileira' }));
    const progresso = screen.getByRole('progressbar', {
      name: 'Instalação de Tradução Brasileira',
    });
    expect(progresso).toHaveAttribute('aria-valuetext', expect.stringMatching(/^Etapa 1 de 3/));
    expect(
      screen.getByRole('button', { name: 'Cancelar instalação de Tradução Brasileira' }),
    ).toBeInTheDocument();

    fonte.liberar();
    expect(
      await screen.findByRole('radio', { name: /TB · Tradução Brasileira/ }),
    ).not.toBeChecked();
    expect(screen.getByText('Tradução Brasileira instalada.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(busca.preparadas).toContain(TB);
  });

  it('troca a versão ativa: a leitura, a busca e o rótulo passam a usar a nova (UC10)', async () => {
    const user = userEvent.setup();
    const busca = new BuscaEmMemoria();
    const { prefs } = renderizarApp({ rota: '/versoes', busca });

    await user.click(await screen.findByRole('button', { name: 'Instalar Tradução Brasileira' }));
    await user.click(await screen.findByRole('radio', { name: /TB · Tradução Brasileira/ }));

    await waitFor(() => expect(prefs.atual?.versaoAtiva).toBe(TB));
    expect(screen.getByRole('radio', { name: /TB · Tradução Brasileira/ })).toBeChecked();
    expect(screen.getByText('Lendo na Tradução Brasileira.')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Ler' }));
    expect(await screen.findByText(/TB GEN 1:1/)).toBeInTheDocument();
    expect(screen.getByTitle('Tradução Brasileira')).toHaveTextContent('TB');

    await user.click(screen.getByRole('link', { name: 'Buscar' }));
    await user.type(await screen.findByRole('searchbox'), 'luz');
    await waitFor(() => expect(busca.buscadas.at(-1)).toBe(TB));
  });

  it('cancelar a instalação não deixa nada instalado', async () => {
    const user = userEvent.setup();
    const fonte = new FonteSintetica(new Canon(), { prefixo: true });
    fonte.segurar();
    const { texto } = renderizarApp({ rota: '/versoes', fonteInstalacao: fonte });

    await user.click(await screen.findByRole('button', { name: 'Instalar Almeida 1911' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar instalação de Almeida 1911' }));
    fonte.liberar();

    expect(await screen.findByText('Instalação de Almeida 1911 cancelada.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Instalar Almeida 1911' })).toBeEnabled();
    expect(await texto.possuiVersao(VersaoId.de('ALM1911'))).toBe(false);
  });

  it('falha de rede mostra o erro e permite tentar de novo (A1)', async () => {
    const user = userEvent.setup();
    const fonte = new FonteSintetica(new Canon(), { falharEm: 'PSA' });
    renderizarApp({ rota: '/versoes', fonteInstalacao: fonte });

    await user.click(await screen.findByRole('button', { name: 'Instalar Tradução Brasileira' }));
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(
      'Não foi possível baixar a versão. Verifique a conexão e tente novamente.',
    );
    const item = alerta.closest('li') as HTMLElement;
    expect(
      within(item).getByRole('button', { name: 'Tentar instalar de novo Tradução Brasileira' }),
    ).toBeInTheDocument();
  });

  it('remove a versão ativa com confirmação e volta para a padrão (RF07.5)', async () => {
    const user = userEvent.setup();
    const { prefs, texto } = renderizarApp({ rota: '/versoes' });
    await user.click(await screen.findByRole('button', { name: 'Instalar Tradução Brasileira' }));
    await user.click(await screen.findByRole('radio', { name: /TB · Tradução Brasileira/ }));
    await waitFor(() => expect(prefs.atual?.versaoAtiva).toBe(TB));

    await user.click(screen.getByRole('button', { name: 'Remover Tradução Brasileira' }));
    const dialogo = screen.getByRole('dialog', { name: 'Remover Tradução Brasileira?' });
    expect(dialogo).toHaveTextContent('os destaques feitos nesta versão voltam');
    await user.click(within(dialogo).getByRole('button', { name: 'Remover versão' }));

    expect(await screen.findByText('Tradução Brasileira removida.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /BLIVRE · Bíblia Livre/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Instalar Tradução Brasileira' })).toBeEnabled();
    expect(prefs.atual?.versaoAtiva).toBe('BLIVRE');
    expect(await texto.possuiVersao(TB)).toBe(false);
  });
});
