import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import type { PreviaImportacao } from '../../aplicacao/casos-de-uso';
import type { ContagemImportacao, ResumoImportacao } from '../../dominio/backup';
import { useAnalisarBackup, useExportarBackup, useImportarBackup } from '../hooks/useBackup';

const botao =
  'focus-visible:outline-primaria flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm hover:bg-stone-50 focus-visible:outline-2 disabled:opacity-50';

/** Oferece o conteúdo como arquivo para baixar. */
function baixar(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface Tipo {
  nome: string;
  feminino?: boolean;
}
const TIPOS: Record<keyof ResumoImportacao, Tipo> = {
  favoritos: { nome: 'Favoritos' },
  destaques: { nome: 'Destaques' },
  anotacoes: { nome: 'Anotações', feminino: true },
  inscricoes: { nome: 'Planos' },
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** "3 novos, 1 já existia" — o que acontece com um tipo ao juntar. */
function descrever(c: ContagemImportacao & { sobrepostos?: number }, { feminino }: Tipo): string {
  const a = feminino ? 'a' : 'o';
  const partes = [
    c.novos && plural(c.novos, `nov${a}`, `nov${a}s`),
    c.atualizados && plural(c.atualizados, `atualizad${a}`, `atualizad${a}s`),
    c.mantidos && plural(c.mantidos, 'já existia', 'já existiam'),
    c.sobrepostos &&
      plural(
        c.sobrepostos,
        'ignorado (sobrepõe um destaque seu)',
        'ignorados (sobrepõem destaques seus)',
      ),
  ].filter(Boolean);
  return partes.length ? partes.join(', ') : 'nada';
}

function ListaResumo({ resumo }: { resumo: ResumoImportacao }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {(Object.keys(TIPOS) as (keyof ResumoImportacao)[]).map((chave) => (
        <div key={chave} className="contents">
          <dt className="font-medium">{TIPOS[chave].nome}</dt>
          <dd className="text-stone-700">{descrever(resumo[chave], TIPOS[chave])}</dd>
        </div>
      ))}
    </dl>
  );
}

type Estado =
  | { fase: 'previa'; conteudo: string; previa: PreviaImportacao }
  | { fase: 'concluida'; resumo: ResumoImportacao }
  | { fase: 'erro'; mensagem: string };

const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * UC11 — exportar e importar backup (RF08), no topo de Meus Estudos. Importar junta o
 * arquivo aos dados do aparelho: antes de gravar, mostra o que vai acontecer e pede
 * confirmação.
 */
export function BackupEstudos({ onAviso }: { onAviso: (mensagem: string) => void }) {
  const exportar = useExportarBackup();
  const analisar = useAnalisarBackup();
  const importar = useImportarBackup();
  const arquivo = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado | null>(null);

  const aoExportar = () =>
    exportar.mutate(undefined, {
      onSuccess: ({ nomeArquivo, conteudo, totais }) => {
        baixar(nomeArquivo, conteudo);
        const n = totais.favoritos + totais.destaques + totais.anotacoes + totais.inscricoes;
        onAviso(`Backup exportado (${plural(n, 'item', 'itens')}): ${nomeArquivo}.`);
      },
      onError: (e) => setEstado({ fase: 'erro', mensagem: mensagemDe(e) }),
    });

  const aoEscolher = async (e: ChangeEvent<HTMLInputElement>) => {
    const escolhido = e.target.files?.[0];
    e.target.value = ''; // escolher o mesmo arquivo de novo dispara outra vez
    if (!escolhido) return;
    let conteudo: string;
    try {
      conteudo = await escolhido.text();
    } catch (erro) {
      setEstado({ fase: 'erro', mensagem: mensagemDe(erro) });
      return;
    }
    analisar.mutate(conteudo, {
      onSuccess: (previa) => setEstado({ fase: 'previa', conteudo, previa }),
      onError: (erro) => setEstado({ fase: 'erro', mensagem: mensagemDe(erro) }),
    });
  };

  const confirmar = (conteudo: string) =>
    importar.mutate(conteudo, {
      onSuccess: (resumo) => {
        setEstado({ fase: 'concluida', resumo });
        onAviso('Backup importado.');
      },
      onError: (erro) => setEstado({ fase: 'erro', mensagem: mensagemDe(erro) }),
    });

  return (
    <div className="flex gap-2">
      <button type="button" className={botao} onClick={aoExportar} disabled={exportar.isPending}>
        <span aria-hidden="true">⇩</span> Exportar <span className="max-sm:sr-only">backup</span>
      </button>
      <button
        type="button"
        className={botao}
        onClick={() => arquivo.current?.click()}
        disabled={analisar.isPending || importar.isPending}
      >
        <span aria-hidden="true">⇧</span> Importar <span className="max-sm:sr-only">backup</span>
      </button>
      <input
        ref={arquivo}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Arquivo de backup"
        onChange={(e) => void aoEscolher(e)}
      />
      {estado && (
        <DialogoImportacao
          estado={estado}
          ocupado={importar.isPending}
          onConfirmar={confirmar}
          onFechar={() => setEstado(null)}
        />
      )}
    </div>
  );
}

function DialogoImportacao({
  estado,
  ocupado,
  onConfirmar,
  onFechar,
}: {
  estado: Estado;
  ocupado: boolean;
  onConfirmar: (conteudo: string) => void;
  onFechar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const fecharBotao = useRef<HTMLButtonElement>(null);
  const id = useId();
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    el.showModal();
    const aoFechar = () => fechar.current();
    el.addEventListener('close', aoFechar);
    return () => el.removeEventListener('close', aoFechar);
  }, []);
  // Foco no botão de saída a cada etapa (Enter sem querer não importa nada).
  useEffect(() => fecharBotao.current?.focus(), [estado.fase]);

  const titulo = {
    previa: 'Importar backup?',
    concluida: 'Backup importado',
    erro: 'Não foi possível importar',
  }[estado.fase];

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={`${id}-titulo`}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-0 font-sans shadow-2xl backdrop:bg-black/30"
    >
      <div className="flex flex-col gap-3 p-5">
        <h2 id={`${id}-titulo`} className="text-lg font-semibold">
          {titulo}
        </h2>
        {estado.fase === 'previa' && (
          <>
            <p className="text-sm text-stone-700">
              Backup de {estado.previa.exportadoEm.toLocaleString('pt-BR')}. Os dados do arquivo
              serão juntados aos deste aparelho — nada do que você já tem é apagado.
            </p>
            <ListaResumo resumo={estado.previa.resumo} />
          </>
        )}
        {estado.fase === 'concluida' && <ListaResumo resumo={estado.resumo} />}
        {estado.fase === 'erro' && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {estado.mensagem}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            ref={fecharBotao}
            onClick={() => dialogo.current?.close()}
            className="focus-visible:outline-primaria rounded-md px-3 py-2 text-sm hover:bg-stone-100 focus-visible:outline-2"
          >
            {estado.fase === 'previa' ? 'Cancelar' : 'Fechar'}
          </button>
          {estado.fase === 'previa' && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => onConfirmar(estado.conteudo)}
              className="bg-primaria text-sobre-tinta focus-visible:outline-primaria rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              Importar
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
