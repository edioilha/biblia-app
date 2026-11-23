import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown';

const html = (texto: string) => render(<Markdown texto={texto} />).container.innerHTML;

describe('Markdown (RF05.5)', () => {
  it('parágrafos e quebras de linha', () => {
    expect(html('um\ndois\n\ntrês')).toBe('<p>um<br>dois</p><p>três</p>');
  });

  it('negrito, itálico e os dois juntos', () => {
    expect(html('**Deus** amou *o mundo* e _todos_')).toBe(
      '<p><strong>Deus</strong> amou <em>o mundo</em> e <em>todos</em></p>',
    );
    expect(html('**muito *amou* mesmo**')).toBe(
      '<p><strong>muito <em>amou</em> mesmo</strong></p>',
    );
  });

  it('não trata asterisco solto como ênfase', () => {
    expect(html('2 * 3 = 6 e a*b')).toBe('<p>2 * 3 = 6 e a*b</p>');
  });

  it('listas com marcador e numeradas', () => {
    expect(html('Pontos:\n- graça\n- fé\n\n3. três\n4. quatro')).toBe(
      '<p>Pontos:</p><ul><li>graça</li><li>fé</li></ul><ol start="3"><li>três</li><li>quatro</li></ol>',
    );
  });

  it('nunca interpreta HTML do texto', () => {
    expect(html('<img src=x onerror=alert(1)> **ok**')).toBe(
      '<p>&lt;img src=x onerror=alert(1)&gt; <strong>ok</strong></p>',
    );
  });
});
