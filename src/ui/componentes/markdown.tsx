import type { ReactNode } from 'react';

/**
 * RF05.5 — Markdown básico das anotações: parágrafos (linha em branco), quebras de linha,
 * listas (`- item`, `* item`, `1. item`), **negrito** e *itálico* (ou _itálico_).
 * Gera elementos React — nunca HTML cru —, então o texto do leitor não injeta marcação.
 */
export function Markdown({ texto }: { texto: string }) {
  return <>{blocos(texto)}</>;
}

const ITEM_LISTA = /^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/u;

type Bloco =
  { tipo: 'p'; linhas: string[] } | { tipo: 'ul' | 'ol'; itens: string[]; inicio: number };

function blocos(texto: string): ReactNode[] {
  const lista: Bloco[] = [];
  let atual = null as Bloco | null;

  for (const linha of texto.replace(/\r\n?/gu, '\n').split('\n')) {
    if (!linha.trim()) {
      atual = null;
      continue;
    }
    const item = ITEM_LISTA.exec(linha);
    if (item) {
      const tipo = item[1] ? 'ul' : 'ol';
      if (atual?.tipo !== tipo) {
        atual = { tipo, itens: [], inicio: Number(item[2] ?? 1) };
        lista.push(atual);
      }
      atual.itens.push(item[3] ?? '');
    } else {
      if (atual?.tipo !== 'p') {
        atual = { tipo: 'p', linhas: [] };
        lista.push(atual);
      }
      atual.linhas.push(linha.trim());
    }
  }

  return lista.map((b, i) => {
    if (b.tipo === 'p') {
      return (
        <p key={i}>
          {b.linhas.flatMap((l, j) =>
            j === 0 ? enfases(l) : [<br key={`br${j}`} />, ...enfases(l)],
          )}
        </p>
      );
    }
    const itens = b.itens.map((t, j) => <li key={j}>{enfases(t)}</li>);
    return b.tipo === 'ul' ? (
      <ul key={i}>{itens}</ul>
    ) : (
      <ol key={i} start={b.inicio === 1 ? undefined : b.inicio}>
        {itens}
      </ol>
    );
  });
}

// **negrito** | *itálico* | _itálico_ (sem espaço logo após a abertura)
const ENFASE = /\*\*(\S(?:.*?\S)?)\*\*|\*(\S(?:.*?\S)?)\*|_(\S(?:.*?\S)?)_/gu;

function enfases(texto: string): ReactNode[] {
  const partes: ReactNode[] = [];
  let pos = 0;
  for (const m of texto.matchAll(ENFASE)) {
    const inicio = m.index;
    if (inicio > pos) partes.push(texto.slice(pos, inicio));
    const [, negrito, italico, sublinhado] = m;
    partes.push(
      negrito !== undefined ? (
        <strong key={inicio}>{enfases(negrito)}</strong>
      ) : (
        <em key={inicio}>{italico ?? sublinhado}</em>
      ),
    );
    pos = inicio + m[0].length;
  }
  if (pos < texto.length) partes.push(texto.slice(pos));
  return partes;
}
