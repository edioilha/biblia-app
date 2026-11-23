import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface AcaoMenu {
  readonly rotulo: string;
  /** Marca visual à esquerda (ex.: amostra da cor). */
  readonly icone?: ReactNode;
  /** Opção atual (ex.: a cor do destaque): mostrada como marcada e desabilitada. */
  readonly atual?: boolean;
  readonly perigosa?: boolean;
  readonly onSelecionar: () => void;
}

/**
 * Menu "⋮" de ações de um item (padrão ARIA menu button): Enter/Espaço/↓ abrem com o foco no
 * primeiro item; ↑/↓, Home/End navegam; Esc fecha e devolve o foco ao botão; clicar fora
 * ou sair com Tab fecha.
 */
export function MenuAcoes({ rotulo, acoes }: { rotulo: string; acoes: readonly AcaoMenu[] }) {
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const id = useId();

  const itens = () => [
    ...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
      []),
  ];
  const focar = (indice: number) => {
    const lista = itens();
    lista.at(indice % lista.length)?.focus();
  };

  useEffect(() => {
    if (!aberto) return;
    menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    const fora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (!menu.current?.contains(alvo) && !botao.current?.contains(alvo)) setAberto(false);
    };
    document.addEventListener('pointerdown', fora);
    return () => document.removeEventListener('pointerdown', fora);
  }, [aberto]);

  const fecharNoBotao = () => {
    setAberto(false);
    botao.current?.focus();
  };

  const aoTeclarMenu = (e: KeyboardEvent) => {
    const lista = itens();
    const atual = lista.indexOf(document.activeElement as HTMLButtonElement);
    const teclas: Record<string, () => void> = {
      ArrowDown: () => focar(atual + 1),
      ArrowUp: () => focar(atual - 1 + lista.length),
      Home: () => focar(0),
      End: () => focar(lista.length - 1),
      Escape: fecharNoBotao,
    };
    const acao = teclas[e.key];
    if (acao) {
      e.preventDefault();
      e.stopPropagation();
      acao();
    } else if (e.key === 'Tab') {
      setAberto(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={botao}
        type="button"
        aria-label={rotulo}
        title={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        onClick={() => setAberto((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAberto(true);
          }
        }}
        className="focus-visible:outline-primaria flex size-9 items-center justify-center rounded-md text-xl leading-none text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-2"
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {aberto && (
        <ul
          ref={menu}
          id={id}
          role="menu"
          aria-label={rotulo}
          onKeyDown={aoTeclarMenu}
          className="absolute top-full right-0 z-20 mt-1 min-w-52 rounded-lg border border-stone-200 bg-white py-1 text-sm shadow-lg"
        >
          {acoes.map((a) => (
            <li key={a.rotulo} role="none">
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={a.atual}
                aria-current={a.atual ? 'true' : undefined}
                onClick={() => {
                  setAberto(false);
                  a.onSelecionar();
                }}
                className={[
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-stone-100 focus:bg-stone-100 focus:outline-none disabled:cursor-default disabled:font-medium',
                  a.perigosa ? 'text-red-800' : '',
                ].join(' ')}
              >
                {a.icone}
                <span>
                  {a.rotulo}
                  {a.atual && <span className="text-stone-500"> (atual)</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
