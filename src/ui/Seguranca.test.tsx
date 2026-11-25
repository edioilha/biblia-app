import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { FonteVersao } from '../aplicacao/portas';
import { TAMANHO_MAXIMO_BACKUP } from '../aplicacao/casos-de-uso';
import type { CodigoLivro, VersaoId } from '../dominio/biblia';
import { anotacao } from '../test/anotacoes';
import { destaque } from '../test/destaques';
import { AnotacoesEmMemoria, DestaquesEmMemoria, FonteSintetica } from '../test/fakes';
import { renderizarApp } from '../test/renderizarApp';

/** BL-16 — conteúdo hostil vindo de fora (versão baixada, backup importado) vira só texto. */
const HOSTIL = '<script>alert(1)</script><img src=x onerror="alert(1)"> [x](javascript:alert(1))';

/** Fonte cujo Jo 3:1 traz HTML no texto (como um arquivo adulterado do biblia.data). */
class FonteHostil implements FonteVersao {
  private readonly base = new FonteSintetica();
  async carregarLivro(versao: VersaoId, livro: CodigoLivro, sinal?: AbortSignal) {
    const l = await this.base.carregarLivro(versao, livro, sinal);
    if (livro.valor !== 'JHN') return l;
    return {
      ...l,
      capitulos: l.capitulos.map((c, i) =>
        i === 2 ? c.map(([n, t]) => [n, n === 1 ? HOSTIL : t] as const) : c,
      ),
    };
  }
}

const semMarcacaoInjetada = () => {
  expect(document.querySelector('script, img, iframe, object')).toBeNull();
  expect(document.querySelector('[href^="javascript:" i], [onerror]')).toBeNull();
};

describe('Entrada hostil (BL-16)', () => {
  it('texto de versão com HTML aparece como texto na leitura', async () => {
    renderizarApp({ rota: '/ler/JHN/3', fonte: new FonteHostil() });
    expect(await screen.findByText(HOSTIL)).toBeInTheDocument();
    semMarcacaoInjetada();
  });

  it('nota com HTML e link javascript: aparece como texto na leitura e em Meus Estudos', async () => {
    const anotacoes = new AnotacoesEmMemoria();
    const nota = anotacao(1, 'Jo 3:1', { conteudo: `${HOSTIL} **negrito**`, exibicao: 'INLINE' });
    anotacoes.itens.set(nota.id, nota);

    const { unmount } = renderizarApp({ rota: '/ler/JHN/3', anotacoes });
    expect(await screen.findByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
    expect(screen.getByText('negrito').tagName).toBe('STRONG');
    semMarcacaoInjetada();
    unmount();

    renderizarApp({ rota: '/estudos?aba=anotacoes', anotacoes });
    expect(await screen.findByText(/<img src=x onerror/)).toBeInTheDocument();
    semMarcacaoInjetada();
  });

  it('destaque com posição além do fim do versículo não quebra a leitura', async () => {
    const destaques = new DestaquesEmMemoria();
    const d = destaque(1, '1:4-1:99999');
    destaques.itens.set(d.id, d);
    renderizarApp({ rota: '/ler/JHN/3', destaques });
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('João');
    expect(screen.getByText(/JHN 3:2/)).toBeInTheDocument();
  });

  it('backup acima do limite é recusado sem ser lido', async () => {
    const user = userEvent.setup();
    renderizarApp({ rota: '/estudos' });
    const arquivo = new File(['{}'], 'enorme.json', { type: 'application/json' });
    Object.defineProperty(arquivo, 'size', { value: TAMANHO_MAXIMO_BACKUP + 1 });
    let lido = false;
    arquivo.text = async () => {
      lido = true;
      return '{}';
    };
    await user.upload(await screen.findByLabelText('Arquivo de backup'), arquivo);

    const dialogo = await screen.findByRole('dialog', { name: 'Não foi possível importar' });
    expect(within(dialogo).getByRole('alert')).toHaveTextContent('grande demais');
    expect(lido).toBe(false);
  });
});
