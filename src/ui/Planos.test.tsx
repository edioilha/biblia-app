import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DataLocal, InscricaoId, InscricaoPlano, PlanoId } from '../dominio/planos';
import { InscricoesEmMemoria, RelogioFixo } from '../test/fakes';
import { renderizarApp } from '../test/renderizarApp';

// Hoje = 10/11/2026 (hora local). Planos reais do catálogo (PlanosPreDefinidos).
const relogio = () => new RelogioFixo(new Date(2026, 10, 10, 9, 0));
const id = (n: number) =>
  InscricaoId.de(`00000000-0000-7000-8000-00000000c${String(n).padStart(3, '0')}`);

async function comPlano(plano: string, inicio: string, dias: number[] = [], total = 31) {
  const inscricoes = new InscricoesEmMemoria();
  await inscricoes.salvar(
    InscricaoPlano.criar(id(1), PlanoId.de(plano), total, DataLocal.iso(inicio), dias),
  );
  return inscricoes;
}
const cartao = (nome: string) => screen.getByRole('region', { name: nome });

describe('Planos de leitura (UC07/UC08)', () => {
  it('sem planos, mostra o catálogo; iniciar pede a data (padrão hoje) (UC07)', async () => {
    const user = userEvent.setup();
    const { inscricoes } = renderizarApp({ rota: '/planos', relogio: relogio() });

    expect(await screen.findByText('Escolha um plano para começar')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Planos' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: 'Iniciar Novo Testamento em 90 dias' }));

    const dialogo = screen.getByRole('dialog', { name: 'Iniciar “Novo Testamento em 90 dias”' });
    const data = within(dialogo).getByLabelText('Data de início');
    expect(data).toHaveValue('2026-11-10');
    expect(data).toHaveFocus();
    expect(within(dialogo).getByText('90 dias, terminando em 07/02/2027.')).toBeInTheDocument();
    await user.click(within(dialogo).getByRole('button', { name: 'Iniciar plano' }));

    const nt = await screen.findByRole('region', { name: 'Novo Testamento em 90 dias' });
    expect(within(nt).getByText('Leitura de hoje · dia 1')).toBeInTheDocument();
    expect(within(nt).getByText('Mateus 1–2')).toBeInTheDocument();
    expect(within(nt).getByRole('link', { name: 'Ler agora' })).toHaveAttribute(
      'href',
      '/ler/MAT/1',
    );
    expect(screen.getByText('Outros planos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Iniciar Novo Testamento/ })).toBeNull();
    expect([...inscricoes.itens.values()].map((i) => i.inicio.paraIso())).toEqual(['2026-11-10']);
  });

  it('Bíblia em 1 ano pela leitura do calendário: começa em 10/11 com Atos (A5)', async () => {
    const user = userEvent.setup();
    const { inscricoes } = renderizarApp({ rota: '/planos', relogio: relogio() });
    await user.click(await screen.findByRole('button', { name: 'Iniciar Bíblia em 1 ano' }));

    const dialogo = screen.getByRole('dialog');
    const partida = within(dialogo).getByRole('group', { name: 'Começar por' });
    expect(within(partida).getByRole('radio', { name: 'Início do plano' })).toBeChecked();
    expect(partida).toHaveTextContent('Gênesis 1–3');
    expect(partida).toHaveTextContent('10/11: Atos 2–4');
    await user.click(within(partida).getByRole('radio', { name: 'Leitura do calendário' }));
    await user.click(within(dialogo).getByRole('button', { name: 'Iniciar plano' }));

    const plano = await screen.findByRole('region', { name: 'Bíblia em 1 ano' });
    expect(within(plano).getByText('Leitura de hoje · dia 1')).toBeInTheDocument();
    expect(within(plano).getByText('Atos 2–4')).toBeInTheDocument();
    expect([...inscricoes.itens.values()].map((i) => i.diaInicial)).toEqual([314]);
  });

  it('começa por um livro escolhido; planos curtos não têm a opção do calendário', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/planos', relogio: relogio() });
    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Novo Testamento em 90 dias' }),
    );
    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).queryByRole('radio', { name: 'Leitura do calendário' })).toBeNull();
    await user.click(within(dialogo).getByRole('radio', { name: 'Um livro' }));
    await user.selectOptions(within(dialogo).getByRole('combobox', { name: 'Livro' }), 'Romanos');
    await user.click(within(dialogo).getByRole('button', { name: 'Iniciar plano' }));

    const nt = await screen.findByRole('region', { name: 'Novo Testamento em 90 dias' });
    expect(within(nt).getByText('Leitura de hoje · dia 1')).toHaveTextContent('dia 1');
    expect(within(nt).getByText('Atos 27–28; Romanos 1')).toBeInTheDocument();
  });

  it('mostra progresso, leitura de hoje e atrasos; conclui hoje e um dia atrasado (A1)', async () => {
    const user = userEvent.setup();
    const inscricoes = await comPlano('salmos-proverbios-31-dias', '2026-11-07', [1]);
    renderizarApp({ rota: '/planos', relogio: relogio(), inscricoes });

    const plano = await screen.findByRole('region', { name: 'Salmos e Provérbios em 31 dias' });
    expect(within(plano).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
    expect(within(plano).getByText(/1 de 31 dias concluídos · hoje é o dia 4/)).toBeInTheDocument();
    expect(within(plano).getByText('Salmos 4, 34, 64, 94, 124; Provérbios 4')).toBeInTheDocument();
    expect(within(plano).getByText('Em atraso · 2 dias')).toBeInTheDocument();

    await user.click(within(plano).getByRole('checkbox', { name: /^Dia 2 ·/ }));
    await waitFor(() =>
      expect(
        within(cartao('Salmos e Provérbios em 31 dias')).getByText('Em atraso · 1 dia'),
      ).toBeInTheDocument(),
    );

    await user.click(
      within(cartao('Salmos e Provérbios em 31 dias')).getByRole('button', { name: '✓ Concluir' }),
    );
    await waitFor(() =>
      expect(
        within(cartao('Salmos e Provérbios em 31 dias')).getByText('✓ Concluído'),
      ).toBeInTheDocument(),
    );
    expect([...(inscricoes.itens.get(id(1))?.diasConcluidos ?? [])].sort()).toEqual([1, 2, 4]);
    // Linha do tempo: dia 4 = hoje, concluído.
    expect(
      within(cartao('Salmos e Provérbios em 31 dias')).getByText(': concluído, hoje'),
    ).toBeInTheDocument();

    await user.click(
      within(cartao('Salmos e Provérbios em 31 dias')).getByRole('button', { name: 'Desfazer' }),
    );
    await waitFor(() =>
      expect(
        within(cartao('Salmos e Provérbios em 31 dias')).getByRole('button', {
          name: '✓ Concluir',
        }),
      ).toBeInTheDocument(),
    );
  });

  it('reagenda com confirmação: o primeiro dia pendente vira hoje (A2)', async () => {
    const user = userEvent.setup();
    const inscricoes = await comPlano('salmos-proverbios-31-dias', '2026-11-01', [1, 2]);
    renderizarApp({ rota: '/planos', relogio: relogio(), inscricoes });

    const plano = await screen.findByRole('region', { name: 'Salmos e Provérbios em 31 dias' });
    await user.click(within(plano).getByRole('button', { name: '↻ Reagendar plano' }));
    const dialogo = screen.getByRole('dialog', { name: 'Reagendar plano?' });
    expect(dialogo).toHaveTextContent(
      'O dia 3 passa a ser a leitura de hoje e o plano termina em 08/12/2026.',
    );
    await user.click(within(dialogo).getByRole('button', { name: 'Reagendar' }));

    await waitFor(() =>
      expect(
        within(cartao('Salmos e Provérbios em 31 dias')).getByText(/hoje é o dia 3/),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Em atraso/)).toBeNull();
    expect(inscricoes.itens.get(id(1))?.inicio.paraIso()).toBe('2026-11-08');
  });

  it('encerra pelo menu, com confirmação; o plano volta ao catálogo', async () => {
    const user = userEvent.setup();
    const inscricoes = await comPlano('salmos-proverbios-31-dias', '2026-11-10');
    renderizarApp({ rota: '/planos', relogio: relogio(), inscricoes });

    await user.click(
      await screen.findByRole('button', { name: 'Ações de Salmos e Provérbios em 31 dias' }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Encerrar plano' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Encerrar plano?' })).getByRole('button', {
        name: 'Encerrar plano',
      }),
    );
    expect(
      await screen.findByRole('button', { name: 'Iniciar Salmos e Provérbios em 31 dias' }),
    ).toBeInTheDocument();
    expect(inscricoes.itens.size).toBe(0);
  });

  it('plano que começa no futuro mostra a primeira leitura, sem concluir', async () => {
    const inscricoes = await comPlano('salmos-proverbios-31-dias', '2026-11-15');
    renderizarApp({ rota: '/planos', relogio: relogio(), inscricoes });
    const plano = await screen.findByRole('region', { name: 'Salmos e Provérbios em 31 dias' });
    expect(within(plano).getByText(/começa em 15\/11\/2026/)).toBeInTheDocument();
    expect(within(plano).getByText('Primeira leitura · dia 1 · 15/11/2026')).toBeInTheDocument();
    expect(within(plano).queryByRole('button', { name: '✓ Concluir' })).toBeNull();
  });

  it('plano concluído oferece começar de novo (A3)', async () => {
    const user = userEvent.setup();
    const todos = Array.from({ length: 31 }, (_, i) => i + 1);
    const inscricoes = await comPlano('salmos-proverbios-31-dias', '2026-10-01', todos);
    renderizarApp({ rota: '/planos', relogio: relogio(), inscricoes });

    const plano = await screen.findByRole('region', { name: 'Salmos e Provérbios em 31 dias' });
    expect(within(plano).getByText(/Plano concluído/)).toBeInTheDocument();
    await user.click(within(plano).getByRole('button', { name: 'Começar de novo' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Iniciar plano' }),
    );
    await waitFor(() =>
      expect(
        within(cartao('Salmos e Provérbios em 31 dias')).getByText(/0 de 31 dias concluídos/),
      ).toBeInTheDocument(),
    );
  });

  describe('faixa do plano na leitura (UC08 passo 3–5)', () => {
    it('aparece no capítulo da leitura de hoje e conclui o dia', async () => {
      const user = userEvent.setup();
      const inscricoes = await comPlano('salmos-proverbios-31-dias', '2026-11-10');
      renderizarApp({ rota: '/ler/PSA/31', relogio: relogio(), inscricoes });

      const faixa = await screen.findByRole('complementary', { name: 'Planos de leitura' });
      expect(faixa).toHaveTextContent(
        'Salmos e Provérbios em 31 dias · Dia 1 · Salmos 1, 31, 61, 91, 121; Provérbios 1',
      );
      await user.click(within(faixa).getByRole('button', { name: 'Concluir dia 1' }));
      await waitFor(() =>
        expect(
          within(screen.getByRole('complementary', { name: 'Planos de leitura' })).getByRole(
            'button',
            {
              name: '✓ Dia 1 concluído',
            },
          ),
        ).toHaveAttribute('aria-pressed', 'true'),
      );
      expect([...(inscricoes.itens.get(id(1))?.diasConcluidos ?? [])]).toEqual([1]);
    });

    it('não aparece em capítulo fora da leitura', async () => {
      const inscricoes = await comPlano('salmos-proverbios-31-dias', '2026-11-10');
      renderizarApp({ rota: '/ler/PSA/2', relogio: relogio(), inscricoes });
      await screen.findByRole('heading', { level: 1 });
      expect(screen.queryByRole('complementary', { name: 'Planos de leitura' })).toBeNull();
    });

    it('marca o dia atrasado quando o capítulo é de um dia anterior', async () => {
      const inscricoes = await comPlano('salmos-proverbios-31-dias', '2026-11-08');
      renderizarApp({ rota: '/ler/PRO/2', relogio: relogio(), inscricoes });
      const faixa = await screen.findByRole('complementary', { name: 'Planos de leitura' });
      expect(faixa).toHaveTextContent('Dia 2 (atrasado)');
    });
  });
});
