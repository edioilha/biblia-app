import type { ReactNode } from 'react';
import type { DestaqueId, FaixaDestacada, NotaAncorada } from '../../dominio/estudo';

/** Id do marcador de rodapé de uma nota (para voltar do rodapé ao texto). */
export const idMarcador = (anotacao: string) => `marcador-${anotacao}`;
/** Id da nota no rodapé. */
export const idNotaRodape = (anotacao: string) => `nota-${anotacao}`;

interface Opcoes {
  faixas: readonly FaixaDestacada[];
  /** Marcadores de rodapé deste versículo (offset `null` = fim do texto). */
  marcadores: readonly NotaAncorada[];
  ativo: DestaqueId | null;
  /** O destaque vem do versículo anterior / segue no próximo (pontas retas). */
  emendaAntes: boolean;
  emendaDepois: boolean;
  onMarcador: (nota: NotaAncorada) => void;
}

/**
 * Monta o texto de um versículo: trechos simples, `<mark>` dos destaques (que não se
 * sobrepõem) e os marcadores de nota de rodapé nos seus offsets. Os marcadores não têm
 * nós de texto (o número vem do CSS), para não alterar os offsets da seleção (UC05).
 */
export function textoComMarcacoes(texto: string, o: Opcoes): ReactNode[] {
  const fim = texto.length;
  const offsetDe = (n: NotaAncorada) => Math.min(n.offset ?? fim, fim);
  const pontos = [
    ...new Set([0, fim, ...o.faixas.flatMap((f) => [f.de, f.ate]), ...o.marcadores.map(offsetDe)]),
  ].sort((a, b) => a - b);

  const partes: ReactNode[] = [];
  const marcadoresEm = (pos: number) =>
    o.marcadores
      .filter((n) => offsetDe(n) === pos)
      .forEach((n) => partes.push(marcador(n, o.onMarcador)));

  marcadoresEm(0);
  pontos.forEach((de, i) => {
    const ate = pontos[i + 1];
    if (ate === undefined) return;
    const pedaco = texto.slice(de, ate);
    const indice = o.faixas.findIndex((f) => f.de <= de && ate <= f.ate);
    const f = o.faixas[indice];
    if (!f) {
      partes.push(pedaco);
    } else {
      const classes = classesMarca(f, o.ativo, {
        inicio: indice === 0 && de === f.de && o.emendaAntes,
        fim: indice === o.faixas.length - 1 && ate === f.ate && o.emendaDepois,
      });
      partes.push(
        <mark key={`m${de}`} data-destaque={f.destaque} data-cor={f.cor} className={classes}>
          {pedaco}
        </mark>,
      );
    }
    marcadoresEm(ate);
  });
  return partes;
}

function marcador(nota: NotaAncorada, onClick: (n: NotaAncorada) => void) {
  return (
    <button
      key={`n${nota.anotacao.id}`}
      id={idMarcador(nota.anotacao.id)}
      type="button"
      data-n={nota.numero}
      aria-label={`Nota ${nota.numero}`}
      onClick={() => onClick(nota)}
      className="marcador-nota focus-visible:outline-primaria rounded-sm focus-visible:outline-2"
    />
  );
}

/** Trecho entre dois versículos (espaço ou número) coberto por um destaque que continua. */
export function emenda(
  f: FaixaDestacada | undefined,
  ativo: DestaqueId | null,
  conteudo: ReactNode,
) {
  if (!f) return conteudo;
  const classes = classesMarca(f, ativo, { inicio: true, fim: true });
  return typeof conteudo === 'string' ? (
    <mark data-destaque={f.destaque} data-cor={f.cor} className={classes}>
      {conteudo}
    </mark>
  ) : (
    // Envolve o número do versículo (um botão): não é texto destacado, só visual.
    <span data-cor={f.cor} className={classes}>
      {conteudo}
    </span>
  );
}

function classesMarca(
  f: FaixaDestacada,
  ativo: DestaqueId | null,
  pontas: { inicio: boolean; fim: boolean },
): string {
  return [
    'marca-texto',
    f.destaque === ativo && 'marca-texto-ativa',
    pontas.inicio && 'marca-emenda-inicio',
    pontas.fim && 'marca-emenda-fim',
  ]
    .filter(Boolean)
    .join(' ');
}
