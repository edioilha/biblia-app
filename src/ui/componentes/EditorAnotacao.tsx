import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ModoExibicao, TAMANHO_MAXIMO_ANOTACAO } from '../../dominio/estudo';

interface Props {
  /** Ex.: "Nota em João 3:16". */
  titulo: string;
  /** Anotação em edição, ou `null` para uma nova. */
  inicial: { conteudo: string; exibicao: ModoExibicao } | null;
  ocupado: boolean;
  /** Falha ao gravar: mostrada dentro do diálogo (fora dele ficaria inerte). */
  erro?: string | null | undefined;
  onSalvar: (conteudo: string, exibicao: ModoExibicao) => void;
  /** Presente ao editar (UC06 A2). */
  onExcluir?: (() => void) | undefined;
  onFechar: () => void;
}

const ROTULO_MODO: Record<ModoExibicao, { nome: string; dica: string }> = {
  RODAPE: { nome: 'Rodapé', dica: 'marcador numerado no texto e nota no pé da página' },
  INLINE: { nome: 'Inline', dica: 'bloco logo abaixo do versículo' },
};

/**
 * UC06 — editor de anotação em `<dialog>` modal (foco preso e Esc nativos). No celular,
 * ocupa a parte de baixo da tela (bottom sheet). Excluir pede confirmação no próprio
 * diálogo. Montado só enquanto aberto.
 */
export function EditorAnotacao({
  titulo,
  inicial,
  ocupado,
  erro,
  onSalvar,
  onExcluir,
  onFechar,
}: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const confirmar = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [conteudo, setConteudo] = useState(inicial?.conteudo ?? '');
  const [exibicao, setExibicao] = useState<ModoExibicao>(inicial?.exibicao ?? ModoExibicao.padrao);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    el.showModal();
    // Foco no texto depois de abrir (o autoFocus do React rodaria antes do showModal).
    campo.current?.focus();
    const aoFechar = () => fechar.current();
    el.addEventListener('close', aoFechar);
    return () => el.removeEventListener('close', aoFechar);
  }, []);

  useEffect(() => {
    if (confirmandoExclusao) confirmar.current?.focus();
  }, [confirmandoExclusao]);

  const vazia = !conteudo.trim();
  const salvar = (e?: FormEvent) => {
    e?.preventDefault();
    if (!vazia && !ocupado) onSalvar(conteudo, exibicao);
  };
  // Ctrl/⌘ + Enter salva sem sair do teclado.
  const aoTeclar = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) salvar();
  };

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={`${id}-titulo`}
      className="editor-anotacao mx-auto mt-auto mb-0 w-full max-w-none rounded-t-xl bg-white p-0 font-sans shadow-2xl backdrop:bg-black/30 sm:m-auto sm:max-w-lg sm:rounded-lg"
    >
      <form
        onSubmit={salvar}
        className="flex flex-col gap-4 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
      >
        <h2 id={`${id}-titulo`} className="font-serif text-lg font-semibold">
          {titulo}
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-texto`} className="text-sm font-medium">
            Texto da nota
          </label>
          <textarea
            id={`${id}-texto`}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            onKeyDown={aoTeclar}
            rows={6}
            maxLength={TAMANHO_MAXIMO_ANOTACAO}
            ref={campo}
            aria-describedby={`${id}-dica`}
            className="focus-visible:outline-primaria w-full resize-y rounded-md border border-stone-300 px-3 py-2 font-serif text-base leading-relaxed focus-visible:outline-2"
          />
          <p id={`${id}-dica`} className="text-tinta-suave text-xs">
            Aceita **negrito**, *itálico* e listas (- item). Ctrl/⌘+Enter salva.
          </p>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-sm font-medium">Exibir</legend>
          {ModoExibicao.todos.map((modo) => (
            <div key={modo} className="flex items-baseline gap-2 text-sm">
              <input
                id={`${id}-${modo}`}
                type="radio"
                name={`${id}-exibicao`}
                value={modo}
                checked={exibicao === modo}
                onChange={() => setExibicao(modo)}
              />
              <label htmlFor={`${id}-${modo}`}>
                <span className="font-medium">{ROTULO_MODO[modo].nome}</span>
                <span className="text-tinta-suave"> — {ROTULO_MODO[modo].dica}</span>
              </label>
            </div>
          ))}
        </fieldset>

        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {erro}
          </p>
        )}

        {confirmandoExclusao ? (
          <div
            role="group"
            aria-label="Confirmar exclusão"
            className="flex flex-wrap items-center justify-end gap-2 rounded-md bg-red-50 p-3"
          >
            <span className="mr-auto text-sm text-red-900">Excluir esta nota?</span>
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-red-100"
            >
              Manter
            </button>
            <button
              type="button"
              ref={confirmar}
              disabled={ocupado}
              onClick={onExcluir}
              className="text-sobre-tinta rounded-md bg-red-700 px-3 py-2 text-sm font-medium hover:bg-red-800 disabled:opacity-50"
            >
              Excluir nota
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {onExcluir && (
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(true)}
                className="mr-auto rounded-md px-3 py-2 text-sm text-red-800 hover:bg-red-50"
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="rounded-md px-3 py-2 text-sm hover:bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={vazia || ocupado}
              className="bg-primaria text-sobre-tinta rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        )}
      </form>
    </dialog>
  );
}
