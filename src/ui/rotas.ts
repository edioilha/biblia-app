import { Referencia, type Canon } from '../dominio/biblia';

/** Caminho da leitura: /ler/JHN/3 ou /ler/JHN/3/16 (HashRouter → #/ler/JHN/3, ADR 0009). */
export function caminhoLeitura(ref: Referencia): string {
  const base = `/ler/${ref.livro.valor}/${ref.capitulo}`;
  return ref.versiculo === null ? base : `${base}/${ref.versiculo}`;
}

/** Converte os parâmetros da rota em Referencia; `null` se não existir no cânon. */
export function referenciaDaRota(
  params: {
    livro?: string | undefined;
    capitulo?: string | undefined;
    versiculo?: string | undefined;
  },
  canon: Canon,
): Referencia | null {
  const { livro, capitulo, versiculo } = params;
  if (!livro || !capitulo || !/^\d+$/.test(capitulo) || (versiculo && !/^\d+$/.test(versiculo))) {
    return null;
  }
  try {
    return Referencia.deChave([livro, capitulo, versiculo].filter(Boolean).join('.'), canon);
  } catch {
    return null;
  }
}
