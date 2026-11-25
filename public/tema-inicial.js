// UC12 — aplica o tema e a largura da página (BL-01) salvos antes de desenhar a página
// (sem piscar o claro nem pular a largura).
// Arquivo separado (não inline) para a Content-Security-Policy aceitar só scripts do site (BL-16).
try {
  const c = JSON.parse(localStorage.getItem('biblia-app:leitura') || 'null');
  if (c && /^(CLARO|SEPIA|ESCURO)$/.test(c.tema)) {
    document.documentElement.dataset.tema = c.tema;
    document.documentElement.style.setProperty('--escala-leitura', String(Number(c.escala) || 1));
    if (/^(ESTREITA|MEDIA|LARGA)$/.test(c.largura))
      document.documentElement.dataset.largura = c.largura;
  }
} catch {
  // sem localStorage: o React aplica logo em seguida
}
