import { BarraAcoes, BotaoBarra } from './BarraAcoes';
import { Icones } from './icones';

interface Props {
  /** Ex.: "João 3:16". */
  rotulo: string;
  favoritado: boolean;
  onAlternarFavorito: () => void;
  /** UC06 — abre o editor de nota do versículo. */
  onAnotar: () => void;
  /** Presente quando o versículo tem marca-texto (UC05 A2, caminho pelo teclado). */
  onRemoverMarcacao?: (() => void) | undefined;
  onFechar: () => void;
}

/**
 * Barra de ações do versículo (UC04, UC05 A6, UC06). Abre ao tocar no
 * número do versículo; recebe o foco ao abrir e fecha com Esc.
 */
export function AcoesVersiculo({
  rotulo,
  favoritado,
  onAlternarFavorito,
  onAnotar,
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
      <BotaoBarra
        onClick={onAlternarFavorito}
        icone={<span className="text-lg text-amber-700">{favoritado ? '★' : '☆'}</span>}
      >
        {favoritado ? 'Remover favorito' : 'Favoritar'}
      </BotaoBarra>
      <BotaoBarra onClick={onAnotar} icone={Icones.lapis}>
        Anotar
      </BotaoBarra>
      {onRemoverMarcacao && (
        <BotaoBarra onClick={onRemoverMarcacao} icone={Icones.borracha}>
          Remover marcação
        </BotaoBarra>
      )}
    </BarraAcoes>
  );
}
