import { useEffect, useRef, type ReactNode, type Ref } from 'react';

interface Props {
  id: string;
  /** Nome acessível da região. */
  rotuloRegiao: string;
  /** Texto curto à esquerda (ex.: "João 3:16"). */
  titulo: string;
  /** Move o foco para o primeiro botão ao abrir (não usar enquanto o leitor seleciona). */
  focarAoAbrir?: boolean;
  onFechar: () => void;
  rotuloFechar: string;
  ref?: Ref<HTMLDivElement> | undefined;
  children: ReactNode;
}

/**
 * Base das barras de ações da leitura (versículo, seleção, destaque): fixa no rodapé em
 * qualquer tela, para não depender de posicionamento junto ao texto nem disputar espaço
 * com o menu nativo de seleção do celular. Fecha com Esc.
 */
export function BarraAcoes({
  id,
  rotuloRegiao,
  titulo,
  focarAoAbrir = true,
  onFechar,
  rotuloFechar,
  ref,
  children,
}: Props) {
  const conteudo = useRef<HTMLDivElement>(null);
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  // Clicar na barra não pode desfazer a seleção de texto (UC05). Ouvinte nativo: só
  // impede o efeito padrão do mouse; os botões continuam recebendo o clique.
  useEffect(() => {
    const el = conteudo.current;
    const manterSelecao = (e: MouseEvent) => e.preventDefault();
    el?.addEventListener('mousedown', manterSelecao);
    return () => el?.removeEventListener('mousedown', manterSelecao);
  }, []);

  useEffect(() => {
    if (focarAoAbrir) conteudo.current?.querySelector('button')?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      fechar.current();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [focarAoAbrir]);

  return (
    <div
      id={id}
      ref={ref}
      role="region"
      aria-label={rotuloRegiao}
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
    >
      <div
        ref={conteudo}
        className="flex max-w-full items-center gap-0.5 rounded-full border border-stone-300 bg-white py-1.5 pr-1.5 pl-4 font-sans text-sm shadow-lg sm:gap-1"
      >
        <span className="mr-1 min-w-0 truncate font-serif font-semibold sm:mr-2">{titulo}</span>
        {children}
        <button
          type="button"
          onClick={onFechar}
          aria-label={rotuloFechar}
          className="focus-visible:outline-primaria flex size-9 shrink-0 items-center justify-center rounded-full text-lg hover:bg-stone-100 focus-visible:outline-2"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
}

/** Botão de texto padrão das barras. */
export function BotaoBarra({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="focus-visible:outline-primaria shrink-0 rounded-full px-2.5 py-2 whitespace-nowrap hover:bg-stone-100 focus-visible:outline-2 disabled:opacity-50 sm:px-3"
    >
      {children}
    </button>
  );
}
