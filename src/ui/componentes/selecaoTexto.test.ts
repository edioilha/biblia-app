import { beforeEach, describe, expect, it } from 'vitest';
import type { IntervaloTexto } from '../../dominio/estudo';
import { capituloJo3, notacao } from '../../test/destaques';
import { intervaloDaSelecao } from './selecaoTexto';

// Mesma estrutura da PaginaPapel: número (sup) + texto do versículo + espaço entre versículos.
// Jo 3:1 "aaa bbb ccc ddd" (com um trecho marcado) · 3:2 "eee fff ggg" · 3:3 "hhh iii"
const HTML = `
  <h1 id="titulo">João</h1>
  <p id="texto"><span id="v1"><sup><button>1</button></sup><span data-texto-versiculo="1">aaa <mark>bbb</mark> ccc ddd</span></span> <span id="v2"><sup><button>2</button></sup><span data-texto-versiculo="2">eee fff ggg</span></span> <span id="v3"><sup><button>3</button></sup><span data-texto-versiculo="3">hhh iii</span></span></p>`;

const capitulo = capituloJo3();
const el = (seletor: string) => {
  const e = document.querySelector(seletor);
  if (!e) throw new Error(seletor);
  return e;
};
/** Primeiro nó de texto do elemento. */
const texto = (seletor: string) => {
  const n = [...el(seletor).childNodes].find((c) => c.nodeType === Node.TEXT_NODE);
  if (!n) throw new Error(`sem texto: ${seletor}`);
  return n;
};
const converter = (inicio: [Node, number], fim: [Node, number]) => {
  const r = document.createRange();
  r.setStart(...inicio);
  r.setEnd(...fim);
  const i: IntervaloTexto | null = intervaloDaSelecao(r, el('#texto'), capitulo);
  return i && notacao(i);
};

describe('intervaloDaSelecao', () => {
  beforeEach(() => {
    document.body.innerHTML = HTML;
  });

  it('conta offsets só do texto, atravessando <mark>', () => {
    expect(converter([texto('[data-texto-versiculo="1"]'), 1], [texto('mark'), 2])).toBe('1:1-1:6');
    // depois do <mark>: "aaa bbb" + 2
    const depois = el('mark').nextSibling as Node;
    expect(converter([texto('mark'), 0], [depois, 2])).toBe('1:4-1:9');
  });

  it('atravessa versículos', () => {
    expect(
      converter([texto('[data-texto-versiculo="1"]'), 2], [texto('[data-texto-versiculo="3"]'), 3]),
    ).toBe('1:2-3:3');
  });

  it('ignora número do versículo e espaço entre versículos (A3)', () => {
    // começa no número do v.2 → início do texto do v.2
    expect(converter([texto('#v2 button'), 0], [texto('[data-texto-versiculo="2"]'), 3])).toBe(
      '2:0-2:3',
    );
    // termina no espaço entre v.2 e v.3 → fim do texto do v.2
    const espaco = el('#v2').nextSibling as Node;
    expect(converter([texto('[data-texto-versiculo="2"]'), 4], [espaco, 1])).toBe('2:4-2:11');
    // termina no número do v.3 → fim do v.2
    expect(converter([texto('[data-texto-versiculo="2"]'), 4], [texto('#v3 button'), 1])).toBe(
      '2:4-2:11',
    );
  });

  it('leva ao texto mais próximo uma seleção que começa fora do texto bíblico', () => {
    expect(converter([texto('#titulo'), 0], [texto('[data-texto-versiculo="1"]'), 3])).toBe(
      '1:0-1:3',
    );
  });

  it('devolve null sem texto bíblico na seleção', () => {
    expect(converter([texto('#v2 button'), 0], [texto('#v2 button'), 1])).toBeNull();
    expect(converter([texto('#titulo'), 0], [texto('#titulo'), 3])).toBeNull();
    const r = document.createRange();
    r.setStart(texto('[data-texto-versiculo="2"]'), 3);
    expect(intervaloDaSelecao(r, el('#texto'), capitulo)).toBeNull();
  });
});
