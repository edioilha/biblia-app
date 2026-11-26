// UC12 — aplica o tema, a largura da página (BL-01), a fonte (BL-02) e a folha (BL-03) salvos
// antes de desenhar a página (sem piscar o claro nem pular a largura ou a fonte).
// Arquivo separado (não inline) para a Content-Security-Policy aceitar só scripts do site (BL-16).
try {
  const c = JSON.parse(localStorage.getItem('biblia-app:leitura') || 'null');
  if (c && /^(CLARO|SEPIA|ESCURO)$/.test(c.tema)) {
    document.documentElement.dataset.tema = c.tema;
    document.documentElement.style.setProperty('--escala-leitura', String(Number(c.escala) || 1));
    if (/^(ESTREITA|MEDIA|LARGA)$/.test(c.largura))
      document.documentElement.dataset.largura = c.largura;
    if (/^(CLASSICA|MODERNA|SEM_SERIFA|LEGIVEL)$/.test(c.fonte))
      document.documentElement.dataset.fonte = c.fonte;
    if (/^(LISO|TEXTURA|ENVELHECIDO|PAUTADO)$/.test(c.folha))
      document.documentElement.dataset.folha = c.folha;
  }
} catch {
  // sem localStorage: o React aplica logo em seguida
}
