import type { ReactNode } from 'react';
import type { Ocorrencia } from '../../dominio/busca';

/** RF02.8 — texto do versículo com os termos encontrados em `<mark>`. */
export function TextoComOcorrencias({
  texto,
  ocorrencias,
}: {
  texto: string;
  ocorrencias: readonly Ocorrencia[];
}) {
  const partes: ReactNode[] = [];
  let pos = 0;
  for (const o of [...ocorrencias].sort((a, b) => a.de - b.de)) {
    if (o.de < pos) continue;
    if (o.de > pos) partes.push(texto.slice(pos, o.de));
    partes.push(
      <mark key={o.de} className="termo-encontrado">
        {texto.slice(o.de, o.ate)}
      </mark>,
    );
    pos = o.ate;
  }
  if (pos < texto.length) partes.push(texto.slice(pos));
  return <>{partes}</>;
}
