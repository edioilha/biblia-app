import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { favorito } from '../test/dadosLeitor';
import { FavoritosEmMemoria } from '../test/fakes';
import { renderizarApp } from '../test/renderizarApp';

/** Guarda o que foi "baixado" (jsdom não tem download nem URL.createObjectURL). */
let baixados: { nome: string; blob: Blob }[] = [];
beforeEach(() => {
  baixados = [];
  const blobs = new Map<string, Blob>();
  URL.createObjectURL = vi.fn((blob: Blob) => {
    const url = `blob:teste/${blobs.size}`;
    blobs.set(url, blob);
    return url;
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    baixados.push({ nome: this.download, blob: blobs.get(this.href) as Blob });
  });
});
afterEach(() => vi.restoreAllMocks());

const comFavoritos = (...lista: ReturnType<typeof favorito>[]) => {
  const repo = new FavoritosEmMemoria();
  for (const f of lista) repo.itens.set(f.id, f);
  return repo;
};

describe('Backup em Meus Estudos (UC11)', () => {
  it('exporta um JSON com os dados do leitor', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/estudos', favoritos: comFavoritos(favorito(1, 'Jo 3:16')) });

    await user.click(await screen.findByRole('button', { name: 'Exportar backup' }));
    await waitFor(() => expect(baixados).toHaveLength(1));
    expect(baixados[0]?.nome).toBe('biblia-app-backup-2026-11-22.json');
    const json = JSON.parse(await (baixados[0]?.blob as Blob).text());
    expect(json).toMatchObject({ app: 'biblia-app', formato: 1 });
    expect(json.favoritos).toHaveLength(1);
    expect(screen.getByText(/Backup exportado \(1 item\)/)).toBeInTheDocument();
  });

  it('importa juntando: mostra a prévia, pede confirmação e atualiza a lista', async () => {
    const user = userEvent.setup();
    // O arquivo vem de outro aparelho, com Jo 3:16 e Gn 1:1.
    const origem = renderizarApp({
      rota: '/estudos',
      favoritos: comFavoritos(favorito(1, 'Jo 3:16'), favorito(2, 'Gn 1:1')),
    });
    await user.click(await screen.findByRole('button', { name: 'Exportar backup' }));
    await waitFor(() => expect(baixados).toHaveLength(1));
    const arquivo = new File([await (baixados[0]?.blob as Blob).text()], 'backup.json', {
      type: 'application/json',
    });
    origem.unmount();

    // Este aparelho já tem Jo 3:16.
    const { favoritos } = renderizarApp({
      rota: '/estudos',
      favoritos: comFavoritos(favorito(9, 'Jo 3:16')),
    });
    expect(await screen.findByText(/^1 favorito/)).toBeInTheDocument();
    await user.upload(screen.getByLabelText('Arquivo de backup'), arquivo);

    const previa = await screen.findByRole('dialog', { name: 'Importar backup?' });
    expect(previa).toHaveTextContent('nada do que você já tem é apagado');
    expect(within(previa).getByText('Favoritos').nextSibling).toHaveTextContent(
      '1 novo, 1 já existia',
    );
    expect(favoritos.itens.size).toBe(1);

    await user.click(within(previa).getByRole('button', { name: 'Importar' }));
    const pronto = await screen.findByRole('dialog', { name: 'Backup importado' });
    await user.click(within(pronto).getByRole('button', { name: 'Fechar' }));
    expect(favoritos.itens.size).toBe(2);
    expect(await screen.findByText(/^2 favoritos/)).toBeInTheDocument();
  });

  it('arquivo que não é backup: explica e não grava nada', async () => {
    const user = userEvent.setup();
    const { favoritos } = renderizarApp({ rota: '/estudos' });
    const arquivo = new File(['{"ola":1}'], 'outro.json', { type: 'application/json' });
    await user.upload(await screen.findByLabelText('Arquivo de backup'), arquivo);

    const dialogo = await screen.findByRole('dialog', { name: 'Não foi possível importar' });
    expect(within(dialogo).getByRole('alert')).toHaveTextContent(
      'O arquivo não é um backup do Bíblia App.',
    );
    expect(favoritos.itens.size).toBe(0);
  });
});
