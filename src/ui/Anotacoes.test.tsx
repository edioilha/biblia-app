import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AnotacoesEmMemoria } from '../test/fakes';
import { renderizarApp } from '../test/renderizarApp';

// Textos sintéticos: "JHN 3:<n>" (fakes.livroSintetico).
const titulo = () => screen.findByRole('heading', { level: 1 });
const numero = (n: number) => screen.getByRole('button', { name: new RegExp(`^Versículo ${n}`) });
const barraVersiculo = () => screen.getByRole('region', { name: /^Ações do versículo/ });
const editor = () => screen.getByRole('dialog');
const rodape = () => screen.getByRole('region', { name: 'Notas do capítulo' });
const textoDo = (n: number) => {
  const el = document.querySelector(`[data-texto-versiculo="${n}"]`);
  if (!el) throw new Error(`versículo ${n}`);
  return el as HTMLElement;
};

async function anotar(
  user: ReturnType<typeof userEvent.setup>,
  versiculo: number,
  texto: string,
  modo?: 'Inline',
) {
  await user.click(numero(versiculo));
  await user.click(within(barraVersiculo()).getByRole('button', { name: 'Anotar' }));
  await user.type(within(editor()).getByRole('textbox', { name: 'Texto da nota' }), texto);
  if (modo) await user.click(within(editor()).getByRole('radio', { name: /^Inline/ }));
  await user.click(within(editor()).getByRole('button', { name: 'Salvar' }));
}

describe('Anotações (UC06)', () => {
  it('anota no rodapé: marcador no texto, nota no pé da página, foco de volta', async () => {
    const user = userEvent.setup();
    const { anotacoes } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();

    await user.click(numero(2));
    await user.click(within(barraVersiculo()).getByRole('button', { name: 'Anotar' }));
    expect(editor()).toHaveAccessibleName('Nota em João 3:2');
    const campo = within(editor()).getByRole('textbox', { name: 'Texto da nota' });
    expect(campo).toHaveFocus();
    expect(within(editor()).getByRole('radio', { name: /^Rodapé/ })).toBeChecked();
    expect(within(editor()).getByRole('button', { name: 'Salvar' })).toBeDisabled(); // A3

    await user.type(campo, '**Importante** aqui');
    await user.click(within(editor()).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Nota salva em João 3:2.');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(numero(2)).toHaveFocus();
    const marcador = within(textoDo(2)).getByRole('button', { name: 'Nota 1' });
    expect(marcador.textContent).toBe(''); // número vem do CSS: não altera offsets
    expect(within(rodape()).getByText('Importante').tagName).toBe('STRONG');
    expect(within(rodape()).getByText('Jo 3:2')).toBeInTheDocument();
    expect([...anotacoes.itens.values()].map((a) => a.conteudo)).toEqual(['**Importante** aqui']);
  });

  it('marcador leva à nota e "Voltar ao texto" volta ao marcador', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    await anotar(user, 1, 'Primeira');
    await anotar(user, 3, 'Segunda');

    const marcador2 = await within(textoDo(3)).findByRole('button', { name: 'Nota 2' });
    await user.click(marcador2);
    const item = within(rodape()).getAllByRole('listitem')[1];
    expect(item).toHaveFocus();
    expect(item).toHaveTextContent('Segunda');

    await user.click(
      within(item as HTMLElement).getByRole('button', { name: 'Voltar ao marcador 2' }),
    );
    expect(marcador2).toHaveFocus();
  });

  it('anota inline: bloco logo após o versículo, dividindo o parágrafo', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    await anotar(user, 2, 'Bloco', 'Inline');

    const bloco = await screen.findByRole('complementary', { name: 'Nota em Jo 3:2' });
    expect(bloco).toHaveTextContent('Bloco');
    expect(bloco.previousElementSibling?.querySelector('#v2')).not.toBeNull();
    expect(bloco.nextElementSibling?.querySelector('#v3')).not.toBeNull();
    expect(screen.queryByRole('region', { name: 'Notas do capítulo' })).toBeNull();
  });

  it('edita (A1) e exclui com confirmação (A2)', async () => {
    const user = userEvent.setup();
    const { anotacoes } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    await anotar(user, 2, 'Antes');

    await user.click(await within(rodape()).findByRole('button', { name: 'Editar nota' }));
    const campo = within(editor()).getByRole('textbox', { name: 'Texto da nota' });
    expect(campo).toHaveValue('Antes');
    await user.clear(campo);
    await user.type(campo, 'Depois');
    await user.click(within(editor()).getByRole('radio', { name: /^Inline/ }));
    await user.click(within(editor()).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Nota de João 3:2 atualizada.');
    const bloco = await screen.findByRole('complementary', { name: 'Nota em Jo 3:2' });
    expect(bloco).toHaveTextContent('Depois');

    await user.click(within(bloco).getByRole('button', { name: 'Editar nota' }));
    await user.click(within(editor()).getByRole('button', { name: 'Excluir' }));
    const confirmar = within(editor()).getByRole('group', { name: 'Confirmar exclusão' });
    expect(within(confirmar).getByRole('button', { name: 'Excluir nota' })).toHaveFocus();
    await user.click(within(confirmar).getByRole('button', { name: 'Manter' }));
    await user.click(within(editor()).getByRole('button', { name: 'Excluir' }));
    await user.click(within(editor()).getByRole('button', { name: 'Excluir nota' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Nota excluída.');
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(anotacoes.itens.size).toBe(0);
    expect(numero(2)).toHaveFocus();
  });

  it('cancelar fecha sem salvar', async () => {
    const user = userEvent.setup();
    const { anotacoes } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    await user.click(numero(1));
    await user.click(within(barraVersiculo()).getByRole('button', { name: 'Anotar' }));
    await user.type(within(editor()).getByRole('textbox'), 'rascunho');
    await user.click(within(editor()).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(anotacoes.itens.size).toBe(0);
    expect(numero(1)).toHaveFocus();
  });

  it('anota um destaque: marcador logo após o trecho marcado', async () => {
    const user = userEvent.setup();
    const { anotacoes } = renderizarApp({ rota: '/ler/JHN/3' });
    await titulo();
    act(() => {
      const t = textoDo(2).firstChild as Text;
      const r = document.createRange();
      r.setStart(t, 0);
      r.setEnd(t, 3);
      document.getSelection()?.removeAllRanges();
      document.getSelection()?.addRange(r);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await user.click(screen.getByRole('button', { name: 'Marcar em amarelo' }));
    const marca = await waitFor(() => {
      const m = textoDo(2).querySelector('mark');
      if (!m) throw new Error('sem marca');
      return m;
    });

    await user.click(marca);
    const barra = screen.getByRole('region', { name: 'Destaque em João 3:2' });
    await user.click(within(barra).getByRole('button', { name: 'Anotar' }));
    expect(editor()).toHaveAccessibleName('Nota no destaque João 3:2');
    await user.type(within(editor()).getByRole('textbox'), 'Sobre o trecho');
    await user.click(within(editor()).getByRole('button', { name: 'Salvar' }));

    const marcador = await within(textoDo(2)).findByRole('button', { name: 'Nota 1' });
    expect(marcador.previousSibling).toBe(textoDo(2).querySelector('mark'));
    expect([...anotacoes.itens.values()][0]?.destaqueId).not.toBeNull();
  });

  it('mostra o erro dentro do editor quando a gravação falha', async () => {
    const user = userEvent.setup();
    const anotacoes = new AnotacoesEmMemoria();
    anotacoes.salvar = () => Promise.reject(new Error('Disco cheio'));
    renderizarApp({ rota: '/ler/JHN/3', anotacoes });
    await titulo();
    await anotar(user, 1, 'Nota');

    expect(await within(editor()).findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar a nota.',
    );
    expect(within(editor()).getByRole('textbox')).toHaveValue('Nota');
  });
});
