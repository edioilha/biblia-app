import { useEffect, useId, useRef, useState } from 'react';
import { ConfiguracaoLeitura, TAMANHO_MAXIMO, Tema } from '../../dominio/preferencias';
import { useConfigurarLeitura, useConfiguracaoLeitura } from '../hooks/useConfiguracaoLeitura';

const NOME_TEMA: Record<Tema, string> = { CLARO: 'Claro', SEPIA: 'Sépia', ESCURO: 'Escuro' };

/** Amostra de cada tema (papel e tinta), independente do tema atual. */
const AMOSTRA: Record<Tema, string> = {
  CLARO: 'bg-[#fbf8f0] text-[#2a2622]',
  SEPIA: 'bg-[#f4ead3] text-[#3b2f22]',
  ESCURO: 'bg-[#1f1c19] text-[#e8e2d8]',
};

const botaoTamanho =
  'focus-visible:outline-primaria flex h-10 flex-1 items-center justify-center rounded-md border border-stone-300 bg-white font-serif hover:bg-stone-50 focus-visible:outline-2 disabled:opacity-40';

/**
 * UC12 — botão "Aa" da leitura: abre um painel com o tamanho do texto (A− / A+) e o tema.
 * As mudanças valem na hora e ficam salvas. Esc fecha e devolve o foco ao botão; clicar
 * fora também fecha.
 */
export function PainelLeitura() {
  const atual = useConfiguracaoLeitura() ?? ConfiguracaoLeitura.padrao;
  const configurar = useConfigurarLeitura();
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!aberto) return;
    painel.current?.querySelector<HTMLElement>('button:not(:disabled), input:checked')?.focus();
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (!painel.current?.contains(alvo) && !botao.current?.contains(alvo)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAberto(false);
      botao.current?.focus();
    };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  return (
    <div className="relative">
      <button
        ref={botao}
        type="button"
        aria-label="Aparência da leitura"
        aria-expanded={aberto}
        aria-controls={`${id}-painel`}
        onClick={() => setAberto((a) => !a)}
        className="border-papel-borda hover:border-tinta-suave focus-visible:outline-primaria rounded-md border bg-white px-2.5 py-1.5 font-serif text-sm focus-visible:outline-2"
      >
        <span aria-hidden="true">
          A<span className="text-base">a</span>
        </span>
      </button>
      {aberto && (
        <div
          ref={painel}
          id={`${id}-painel`}
          role="group"
          aria-label="Aparência da leitura"
          className="absolute top-full right-0 z-30 mt-2 flex w-64 flex-col gap-4 rounded-lg border border-stone-300 bg-white p-4 font-sans text-sm shadow-lg"
        >
          <div className="flex flex-col gap-2">
            <span id={`${id}-tamanho`} className="font-medium">
              Tamanho do texto
            </span>
            <div className="flex items-center gap-2" role="group" aria-labelledby={`${id}-tamanho`}>
              <button
                type="button"
                aria-label="Diminuir o texto"
                disabled={!atual.podeDiminuir}
                onClick={() => configurar.mutate(atual.diminuir())}
                className={`${botaoTamanho} text-sm`}
              >
                A−
              </button>
              <output aria-live="polite" className="w-14 text-center text-stone-600 tabular-nums">
                {atual.tamanhoFonte} de {TAMANHO_MAXIMO}
              </output>
              <button
                type="button"
                aria-label="Aumentar o texto"
                disabled={!atual.podeAumentar}
                onClick={() => configurar.mutate(atual.aumentar())}
                className={`${botaoTamanho} text-xl`}
              >
                A+
              </button>
            </div>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-medium">Tema</legend>
            <div className="grid grid-cols-3 gap-2">
              {Tema.todos.map((tema) => (
                <label key={tema} className="flex cursor-pointer flex-col items-center gap-1">
                  <input
                    type="radio"
                    name={`${id}-tema`}
                    value={tema}
                    checked={atual.tema === tema}
                    onChange={() => configurar.mutate(atual.comTema(tema))}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`peer-checked:outline-primaria peer-focus-visible:ring-primaria flex h-10 w-full items-center justify-center rounded-md border border-stone-300 font-serif text-base peer-checked:outline-2 peer-checked:outline-offset-1 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${AMOSTRA[tema]}`}
                  >
                    Aa
                  </span>
                  <span>{NOME_TEMA[tema]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {configurar.isError && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-800">
              Não foi possível salvar a preferência.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
