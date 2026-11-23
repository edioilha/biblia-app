import { BarraAcoes, BotaoBarra } from './BarraAcoes';

interface Props {
  /** Ex.: "João 3:16". */
  rotulo: string;
  favoritado: boolean;
  onAlternarFavorito: () => void;
  /** Presente quando o versículo tem marca-texto (UC05 A2, caminho pelo teclado). */
  onRemoverMarcacao?: (() => void) | undefined;
  onFechar: () => void;
}

/**
 * Barra de ações do versículo (UC04, UC05 A2; Anotar entra em 7.4). Abre ao tocar no
 * número do versículo; recebe o foco ao abrir e fecha com Esc.
 */
export function AcoesVersiculo({
  rotulo,
  favoritado,
  onAlternarFavorito,
  onRemoverMarcacao,
  onFechar,
}: Props) {
  return (
    <BarraAcoes
      id="acoes-versiculo"
      rotuloRegiao={`Ações do versículo ${rotulo}`}
      titulo={rotulo}
      onFechar={onFechar}
      rotuloFechar="Fechar ações do versículo"
    >
      <BotaoBarra onClick={onAlternarFavorito}>
        <span aria-hidden="true" className="mr-1.5 text-amber-700">
          {favoritado ? '★' : '☆'}
        </span>
        {favoritado ? 'Remover favorito' : 'Favoritar'}
      </BotaoBarra>
      {onRemoverMarcacao && <BotaoBarra onClick={onRemoverMarcacao}>Remover marcação</BotaoBarra>}
    </BarraAcoes>
  );
}
