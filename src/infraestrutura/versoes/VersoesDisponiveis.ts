import type { CatalogoVersoes } from '../../aplicacao/portas';
import { Versao, VersaoId } from '../../dominio/biblia';

const ORIGEM = 'https://github.com/Projeto-Euaggelion/biblia.data';

/**
 * Catálogo de versões (ADR 0007): lista explícita das traduções em domínio público do
 * biblia.data. A BLIVRE vem com o app (RF07.1); as demais são instaladas (UC09).
 * `tamanhoMb` é o download aproximado dos 66 arquivos.
 */
export class VersoesDisponiveis implements CatalogoVersoes {
  private readonly versoes: readonly Versao[] = [
    new Versao(VersaoId.de('BLIVRE'), 'Bíblia Livre', 2018, 'Domínio público', ORIGEM, true),
    new Versao(
      VersaoId.de('TB'),
      'Tradução Brasileira',
      1917,
      'Domínio público',
      ORIGEM,
      false,
      '',
      6,
    ),
    new Versao(
      VersaoId.de('ALM1911'),
      'Almeida 1911',
      1911,
      'Domínio público',
      ORIGEM,
      false,
      'ortografia antiga',
      6,
    ),
  ];

  todas(): readonly Versao[] {
    return this.versoes;
  }

  padrao(): Versao {
    const padrao = this.versoes.find((v) => v.padrao);
    if (!padrao) throw new Error('Catálogo sem versão padrão.');
    return padrao;
  }

  porId(id: VersaoId): Versao | null {
    return this.versoes.find((v) => v.id === id) ?? null;
  }
}
