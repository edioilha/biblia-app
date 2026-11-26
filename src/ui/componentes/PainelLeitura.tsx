import { useEffect, useId, useRef, useState } from 'react';
import {
  ConfiguracaoLeitura,
  FamiliaFonte,
  LarguraPagina,
  TAMANHO_MAXIMO,
  Tema,
  TipoFolha,
} from '../../dominio/preferencias';
import { useConfigurarLeitura, useConfiguracaoLeitura } from '../hooks/useConfiguracaoLeitura';

const NOME_TEMA: Record<Tema, string> = { CLARO: 'Claro', SEPIA: 'Sépia', ESCURO: 'Escuro' };

/** Amostra de cada tema (papel e tinta), independente do tema atual. */
const AMOSTRA: Record<Tema, string> = {
  CLARO: 'bg-[#fbf8f0] text-[#2a2622]',
  SEPIA: 'bg-[#f4ead3] text-[#3b2f22]',
  ESCURO: 'bg-[#1f1c19] text-[#e8e2d8]',
};

const NOME_LARGURA: Record<LarguraPagina, string> = {
  ESTREITA: 'Estreita',
  MEDIA: 'Média',
  LARGA: 'Larga',
};

/** Largura do ícone de cada opção (a página entre as duas barras). */
const ICONE_LARGURA: Record<LarguraPagina, string> = {
  ESTREITA: 'w-3',
  MEDIA: 'w-5',
  LARGA: 'w-7',
};

const NOME_FONTE: Record<FamiliaFonte, string> = {
  CLASSICA: 'Clássica',
  MODERNA: 'Moderna',
  SEM_SERIFA: 'Sem serifa',
  LEGIVEL: 'Legível',
};

/** Amostra de cada fonte na própria família (tokens em estilos/index.css). */
const CLASSE_FONTE: Record<FamiliaFonte, string> = {
  CLASSICA: 'font-serif',
  MODERNA: 'font-moderna',
  SEM_SERIFA: 'font-sans',
  LEGIVEL: 'font-legivel',
};

const NOME_FOLHA: Record<TipoFolha, string> = {
  LISO: 'Lisa',
  TEXTURA: 'Textura',
  ENVELHECIDO: 'Envelhecida',
  PAUTADO: 'Pautada',
};

const opcao =
  'peer-checked:outline-primaria peer-focus-visible:ring-primaria flex h-10 w-full items-center justify-center rounded-md border border-stone-300 peer-checked:outline-2 peer-checked:outline-offset-1 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2';

const botaoTamanho =
  'focus-visible:outline-primaria flex h-10 flex-1 items-center justify-center rounded-md border border-stone-300 bg-white font-serif hover:bg-stone-50 focus-visible:outline-2 disabled:opacity-40';

/**
 * UC12 — botão "Aa" da leitura: abre um painel com o tamanho do texto (A− / A+), a fonte
 * (BL-02), o tema, o tipo de folha (BL-03) e, a partir de 768 px, a largura da página
 * (BL-01; no celular a página já ocupa a tela).
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
          className="absolute top-full right-0 z-30 mt-2 flex max-h-[calc(100dvh-5rem-var(--base-inferior))] w-64 flex-col gap-4 overflow-y-auto overscroll-contain rounded-lg border border-stone-300 bg-white p-4 font-sans text-sm shadow-lg"
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
            <legend className="mb-2 font-medium">Fonte</legend>
            <div className="grid grid-cols-2 gap-2">
              {FamiliaFonte.todas.map((fonte) => (
                <label key={fonte} className="flex cursor-pointer flex-col items-center gap-1">
                  <input
                    type="radio"
                    name={`${id}-fonte`}
                    value={fonte}
                    checked={atual.fonte === fonte}
                    onChange={() => configurar.mutate(atual.comFonte(fonte))}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`${opcao} bg-white text-lg ${CLASSE_FONTE[fonte]}`}
                  >
                    Aa
                  </span>
                  <span>{NOME_FONTE[fonte]}</span>
                </label>
              ))}
            </div>
          </fieldset>
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
                    className={`${opcao} font-serif text-base ${AMOSTRA[tema]}`}
                  >
                    Aa
                  </span>
                  <span>{NOME_TEMA[tema]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-medium">Folha</legend>
            <div className="grid grid-cols-2 gap-2">
              {TipoFolha.todas.map((folha) => (
                <label key={folha} className="flex cursor-pointer flex-col items-center gap-1">
                  <input
                    type="radio"
                    name={`${id}-folha`}
                    value={folha}
                    checked={atual.folha === folha}
                    onChange={() => configurar.mutate(atual.comFolha(folha))}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    data-folha={folha}
                    className={`${opcao} amostra-folha`}
                  />
                  <span>{NOME_FOLHA[folha]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="hidden flex-col gap-2 md:flex">
            <legend className="mb-2 font-medium">Largura da página</legend>
            <div className="grid grid-cols-3 gap-2">
              {LarguraPagina.todas.map((largura) => (
                <label key={largura} className="flex cursor-pointer flex-col items-center gap-1">
                  <input
                    type="radio"
                    name={`${id}-largura`}
                    value={largura}
                    checked={atual.largura === largura}
                    onChange={() => configurar.mutate(atual.comLargura(largura))}
                    className="peer sr-only"
                  />
                  <span aria-hidden="true" className={`${opcao} bg-white`}>
                    <span className={`h-4 border-x-2 border-stone-500 ${ICONE_LARGURA[largura]}`} />
                  </span>
                  <span>{NOME_LARGURA[largura]}</span>
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
