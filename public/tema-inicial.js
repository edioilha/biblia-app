// UC12 — aplica o tema salvo antes de desenhar a página (sem piscar o claro).
// Arquivo separado (não inline) para a Content-Security-Policy aceitar só scripts do site (BL-16).
try {
  const c = JSON.parse(localStorage.getItem('biblia-app:leitura') || 'null');
  if (c && /^(CLARO|SEPIA|ESCURO)$/.test(c.tema)) {
    document.documentElement.dataset.tema = c.tema;
    document.documentElement.style.setProperty('--escala-leitura', String(Number(c.escala) || 1));
  }
} catch {
  // sem localStorage: o React aplica logo em seguida
}
