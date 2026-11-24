import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Referencia } from '../dominio/biblia';
import { Favorito, FavoritoId } from '../dominio/estudo';
import { anotacao } from '../test/anotacoes';
import { canon, destaque } from '../test/destaques';
import { AnotacoesEmMemoria, DestaquesEmMemoria, FavoritosEmMemoria } from '../test/fakes';
import { renderizarApp } from '../test/renderizarApp';

// Textos sintéticos: "<LIVRO> <cap>:<v>", 3 versículos por capítulo (fakes.livroSintetico).
const favorito = (n: number, versiculo: string) =>
  Favorito.criar(
    FavoritoId.de(`00000000-0000-7000-8000-00000000f${String(n).padStart(3, '0')}`),
    Referencia.parse(versiculo, canon),
    new Date(Date.UTC(2026, 10, 22, 9, n)),
  );

const aba = (nome: RegExp) => screen.getByRole('tab', { name: nome });
const status = () => screen.getByRole('status');
const lista = (nome: string) => screen.getByRole('list', { name: nome });
const links = (nome: string) =>
  within(lista(nome))
    .getAllByRole('link')
    .map((l) => l.querySelector('.font-semibold')?.textContent);

async function montar(
  favoritosIniciais: string[] = [],
  opcoes: { rota?: string; destaques?: boolean; anotacoes?: boolean } = {},
) {
  const favoritos = new FavoritosEmMemoria();
  for (const [i, v] of favoritosIniciais.entries()) await favoritos.salvar(favorito(i + 1, v));
  const anotacoes = new AnotacoesEmMemoria();
  const destaques = new DestaquesEmMemoria(anotacoes);
  if (opcoes.destaques) {
    // Jo 3:1 "JHN 3:1": offsets 0–3 = "JHN".
    await destaques.aplicar({ salvar: [destaque(1, '1:0-1:3', 'VERDE')], remover: [] });
  }
  if (opcoes.anotacoes) {
    await anotacoes.salvar(anotacao(1, 'Jo 3:2', { conteudo: 'Sobre **Nicodemos**' }));
    await anotacoes.salvar(anotacao(2, 'Gn 1:1', { conteudo: 'Criação', exibicao: 'INLINE' }));
  }
  const app = renderizarApp({ rota: opcoes.rota ?? '/estudos', favoritos, destaques, anotacoes });
  if (!opcoes.rota?.startsWith('/ler')) {
    await screen.findByRole('tablist', { name: 'Meus Estudos' });
  }
  return app;
}

describe('Meus Estudos (UC13)', () => {
  it('abre em Favoritos, com o total de cada aba e a lista em ordem bíblica', async () => {
    await montar(['Jo 3:16', 'Gn 1:2'], { destaques: true, anotacoes: true });

    expect(screen.getByRole('link', { name: 'Meus Estudos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await waitFor(() => expect(status()).toHaveTextContent('2 favoritos · página 1 de 1'));
    expect(aba(/^Favoritos/)).toHaveAttribute('aria-selected', 'true');
    expect(aba(/^Favoritos/)).toHaveTextContent('2');
    expect(aba(/^Destaques/)).toHaveTextContent('1');
    expect(aba(/^Anotações/)).toHaveTextContent('2');

    expect(links('Favoritos')).toEqual(['Gênesis 1:2', 'João 3:16']);
    const gn = within(lista('Favoritos')).getAllByRole('link')[0];
    expect(gn).toHaveAttribute('href', '/ler/GEN/1/2');
    expect(gn).toHaveTextContent('GEN 1:2');
  });

  it('troca de aba pelo teclado; destaques mostram o trecho com a cor', async () => {
    const user = userEvent.setup();
    await montar(['Jo 3:3'], { destaques: true });

    aba(/^Favoritos/).focus();
    await user.keyboard('{ArrowRight}');
    expect(aba(/^Destaques/)).toHaveFocus();
    await waitFor(() => expect(status()).toHaveTextContent('1 destaque'));
    const marca = within(lista('Destaques')).getByText('JHN');
    expect(marca.tagName).toBe('MARK');
    expect(marca).toHaveAttribute('data-cor', 'VERDE');
  });

  it('anotações mostram o versículo e a nota; o filtro procura no texto e na nota (RF02.9)', async () => {
    const user = userEvent.setup();
    await montar([], { anotacoes: true, rota: '/estudos?aba=anotacoes' });
    await waitFor(() => expect(status()).toHaveTextContent('2 anotações'));
    expect(within(lista('Anotações')).getByText('Nicodemos').tagName).toBe('STRONG');

    await user.type(
      screen.getByRole('searchbox', { name: 'Filtrar no texto ou na nota' }),
      'nicodemos',
    );
    await waitFor(() => expect(status()).toHaveTextContent('1 anotação'));
    expect(links('Anotações')).toEqual(['João 3:2']);
    // Trocar de aba mantém o filtro (A1).
    expect(aba(/^Favoritos/)).toHaveTextContent('0');
  });

  it('filtra por livro e, sem resultados, oferece limpar o filtro', async () => {
    const user = userEvent.setup();
    await montar(['Jo 3:16', 'Gn 1:2']);
    await waitFor(() => expect(status()).toHaveTextContent('2 favoritos'));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Livro' }), 'Gênesis');
    await waitFor(() => expect(links('Favoritos')).toEqual(['Gênesis 1:2']));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Livro' }), 'Romanos');
    await waitFor(() => expect(status()).toHaveTextContent('Nenhum item em Favoritos'));

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await waitFor(() => expect(status()).toHaveTextContent('2 favoritos'));
  });

  it('remove um favorito com confirmação (A4)', async () => {
    const user = userEvent.setup();
    const { favoritos } = await montar(['Jo 3:16', 'Gn 1:2']);
    await waitFor(() => expect(status()).toHaveTextContent('2 favoritos'));

    await user.click(screen.getByRole('button', { name: 'Ações de João 3:16' }));
    const menu = screen.getByRole('menu', { name: 'Ações de João 3:16' });
    expect(within(menu).getByRole('menuitem', { name: 'Remover dos favoritos' })).toHaveFocus();
    await user.keyboard('{Enter}');

    const dialogo = screen.getByRole('dialog', { name: 'Remover dos favoritos?' });
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await user.click(within(dialogo).getByRole('button', { name: 'Remover favorito' }));

    await waitFor(() => expect(status()).toHaveTextContent('1 favorito ·'));
    expect(links('Favoritos')).toEqual(['Gênesis 1:2']);
    expect([...favoritos.itens.values()].map((f) => f.referencia.chave())).toEqual(['GEN.1.2']);
  });

  it('muda a cor do destaque pelo menu', async () => {
    const user = userEvent.setup();
    const { destaques } = await montar([], { destaques: true, rota: '/estudos?aba=destaques' });
    await waitFor(() => expect(status()).toHaveTextContent('1 destaque'));

    await user.click(screen.getByRole('button', { name: 'Ações de João 3:1' }));
    expect(screen.getByRole('menuitem', { name: /Cor verde/ })).toBeDisabled();
    await user.click(screen.getByRole('menuitem', { name: 'Cor rosa' }));
    await waitFor(() =>
      expect(within(lista('Destaques')).getByText('JHN')).toHaveAttribute('data-cor', 'ROSA'),
    );
    expect([...destaques.itens.values()].map((d) => d.cor)).toEqual(['ROSA']);
  });

  it('edita a nota pelo menu (A4)', async () => {
    const user = userEvent.setup();
    const { anotacoes } = await montar([], { anotacoes: true, rota: '/estudos?aba=anotacoes' });
    await waitFor(() => expect(status()).toHaveTextContent('2 anotações'));

    await user.click(screen.getByRole('button', { name: 'Ações de Gênesis 1:1' }));
    await user.click(screen.getByRole('menuitem', { name: 'Editar nota' }));
    const editor = screen.getByRole('dialog', { name: 'Nota em Gênesis 1:1' });
    const campo = within(editor).getByRole('textbox', { name: 'Texto da nota' });
    expect(campo).toHaveValue('Criação');
    await user.clear(campo);
    await user.type(campo, 'No princípio');
    await user.click(within(editor).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(within(lista('Anotações')).getByText('No princípio')).toBeVisible());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect([...anotacoes.itens.values()].map((a) => a.conteudo).sort()).toEqual([
      'No princípio',
      'Sobre **Nicodemos**',
    ]);
  });

  it('sem nada marcado, orienta a marcar na leitura (A5)', async () => {
    await montar();
    expect(
      await screen.findByText('Selecione um texto na leitura para marcar, anotar ou favoritar.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para a leitura' })).toHaveAttribute('href', '/');
  });

  it('pagina de 20 em 20 (RF09.4)', async () => {
    const user = userEvent.setup();
    const versiculos = Array.from({ length: 25 }, (_, i) => `Sl ${i + 1}:1`);
    await montar(versiculos);
    await waitFor(() => expect(status()).toHaveTextContent('25 favoritos · página 1 de 2'));
    expect(links('Favoritos')).toHaveLength(20);

    await user.click(screen.getByRole('button', { name: 'Próxima página' }));
    await waitFor(() => expect(status()).toHaveTextContent('página 2 de 2'));
    expect(links('Favoritos')).toHaveLength(5);
  });

  it('o que se marca na leitura aparece em Meus Estudos', async () => {
    const user = userEvent.setup();
    await montar([], { rota: '/ler/JHN/3' });
    await user.click(await screen.findByRole('button', { name: /^Versículo 2/ }));
    await user.click(screen.getByRole('button', { name: /Favoritar/ }));
    await screen.findByRole('button', { name: 'Versículo 2, favorito' });

    await user.click(screen.getByRole('link', { name: 'Meus Estudos' }));
    await waitFor(() => expect(status()).toHaveTextContent('1 favorito'));
    expect(links('Favoritos')).toEqual(['João 3:2']);
  });
});
