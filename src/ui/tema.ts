import type { ConfiguracaoLeitura, Tema } from '../dominio/preferencias';

/**
 * Onde tema, escala, largura, fonte e folha ficam espelhados para o `tema-inicial.js` aplicar antes do
 * React (sem piscar o tema nem pular a largura, a fonte ou a folha da página).
 */
export const CHAVE_TEMA_LOCAL = 'biblia-app:leitura';

/** Nível 1–7 do tamanho da fonte → multiplicador do tamanho base do texto (nível 3 = 1). */
const ESCALAS = [0.8, 0.9, 1, 1.12, 1.25, 1.4, 1.6] as const;
export const escalaDoTamanho = (nivel: number) => ESCALAS[nivel - 1] ?? 1;

/** Cor da barra do navegador/sistema em cada tema (meta theme-color). */
const COR_BARRA: Record<Tema, string> = {
  CLARO: '#2c5282',
  SEPIA: '#6a5841',
  ESCURO: '#1f1c19',
};

export function aplicarNoDocumento(c: ConfiguracaoLeitura): void {
  const { tema, tamanhoFonte, largura, fonte, folha } = c;
  const html = document.documentElement;
  const escala = escalaDoTamanho(tamanhoFonte);
  html.dataset['tema'] = tema;
  html.dataset['largura'] = largura; // BL-01 (CSS em estilos/index.css)
  html.dataset['fonte'] = fonte; // BL-02
  html.dataset['folha'] = folha; // BL-03
  html.style.setProperty('--escala-leitura', String(escala));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_BARRA[tema]);
  try {
    localStorage.setItem(CHAVE_TEMA_LOCAL, JSON.stringify({ tema, escala, largura, fonte, folha }));
  } catch {
    // Sem armazenamento local (ex.: modo privado): só não evita a piscada na abertura.
  }
}
