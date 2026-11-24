import { useEffect } from 'react';
import { useConfiguracaoLeitura } from '../hooks/useConfiguracaoLeitura';
import { aplicarNoDocumento } from '../tema';

/** UC12 — aplica o tema e o tamanho da fonte salvos ao app inteiro (`<html>`). */
export function AplicarTema() {
  const leitura = useConfiguracaoLeitura();
  useEffect(() => {
    if (leitura) aplicarNoDocumento(leitura);
  }, [leitura]);
  return null;
}
