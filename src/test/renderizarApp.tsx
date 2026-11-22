import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import {
  AbrirCapitulo,
  ObterPosicaoInicial,
  PrepararVersaoPadrao,
} from '../aplicacao/casos-de-uso';
import type { FonteVersaoEmbarcada } from '../aplicacao/portas';
import { Canon, Versao, VersaoId } from '../dominio/biblia';
import type { Preferencias } from '../dominio/preferencias';
import { App } from '../ui/App';
import { DependenciasProvider, type Dependencias } from '../ui/contexto/Dependencias';
import { FonteSintetica, PreferenciasEmMemoria, TextoBiblicoEmMemoria } from './fakes';

interface Opcoes {
  rota?: string;
  preferencias?: Preferencias | null;
  fonte?: FonteVersaoEmbarcada;
}

/** Monta o app completo com as portas em memória e um MemoryRouter. */
export function renderizarApp({ rota = '/', preferencias = null, fonte }: Opcoes = {}) {
  const canon = new Canon();
  const versao = new Versao(
    VersaoId.de('BLIVRE'),
    'Bíblia Livre',
    2018,
    'Domínio público',
    '',
    true,
  );
  const texto = new TextoBiblicoEmMemoria(canon);
  const prefs = new PreferenciasEmMemoria(preferencias);
  const deps: Dependencias = {
    canon,
    versaoPadrao: versao,
    abrirCapitulo: new AbrirCapitulo(canon, texto, prefs, versao.id),
    obterPosicaoInicial: new ObterPosicaoInicial(canon, prefs),
    prepararVersaoPadrao: new PrepararVersaoPadrao(
      canon,
      fonte ?? new FonteSintetica(canon),
      texto,
      versao.id,
    ),
  };

  const resultado = render(
    <DependenciasProvider valor={deps}>
      <MemoryRouter initialEntries={[rota]}>
        <App />
      </MemoryRouter>
    </DependenciasProvider>,
  );
  return { ...resultado, canon, prefs, texto };
}
