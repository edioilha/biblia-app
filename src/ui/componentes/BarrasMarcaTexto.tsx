import type { Ref } from 'react';
import { CorDestaque } from '../../dominio/estudo';
import { BarraAcoes, BotaoBarra } from './BarraAcoes';
import { Icones } from './icones';
import { NOME_COR } from './nomesCores';

function BotaoCor({
  cor,
  rotulo,
  pressionado,
  onClick,
  disabled,
}: {
  cor: CorDestaque;
  rotulo: string;
  pressionado?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
      aria-pressed={pressionado}
      title={rotulo}
      className="focus-visible:outline-primaria flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-stone-100 focus-visible:outline-2 disabled:opacity-50 sm:size-9"
    >
      <span
        aria-hidden="true"
        data-cor={cor}
        className={`amostra-cor size-6 rounded-full border border-stone-400/60 ${pressionado ? 'ring-tinta ring-2 ring-offset-1' : ''}`}
      />
    </button>
  );
}

/**
 * UC05 passo 2 — barra que aparece ao selecionar um trecho: uma cor = marcar nessa cor.
 * Não recebe o foco (o leitor pode continuar ajustando a seleção).
 */
export function BarraSelecao({
  ref,
  ocupado,
  onMarcar,
  onDesmarcar,
  onFechar,
}: {
  ref?: Ref<HTMLDivElement> | undefined;
  ocupado: boolean;
  onMarcar: (cor: CorDestaque) => void;
  /** Presente quando a seleção cobre algum destaque (borracha). */
  onDesmarcar?: (() => void) | undefined;
  onFechar: () => void;
}) {
  return (
    <BarraAcoes
      id="acoes-selecao"
      ref={ref}
      rotuloRegiao="Marcar trecho selecionado"
      titulo="Marcar"
      focarAoAbrir={false}
      onFechar={onFechar}
      rotuloFechar="Cancelar seleção"
    >
      {CorDestaque.todas.map((cor) => (
        <BotaoCor
          key={cor}
          cor={cor}
          rotulo={`Marcar em ${NOME_COR[cor]}`}
          onClick={() => onMarcar(cor)}
          disabled={ocupado}
        />
      ))}
      {onDesmarcar && (
        <BotaoBarra onClick={onDesmarcar} disabled={ocupado} icone={Icones.borracha}>
          Desmarcar
        </BotaoBarra>
      )}
    </BarraAcoes>
  );
}

/** UC05 A4 — barra de um destaque tocado: trocar a cor, anotar (UC06) ou remover. */
export function BarraDestaque({
  rotulo,
  cor,
  ocupado,
  onCor,
  onAnotar,
  onRemover,
  onFechar,
}: {
  /** Ex.: "João 3:16–17". */
  rotulo: string;
  cor: CorDestaque;
  ocupado: boolean;
  onCor: (cor: CorDestaque) => void;
  onAnotar: () => void;
  onRemover: () => void;
  onFechar: () => void;
}) {
  return (
    <BarraAcoes
      id="acoes-destaque"
      rotuloRegiao={`Destaque em ${rotulo}`}
      titulo={rotulo}
      onFechar={onFechar}
      rotuloFechar="Fechar ações do destaque"
    >
      {CorDestaque.todas.map((c) => (
        <BotaoCor
          key={c}
          cor={c}
          rotulo={NOME_COR[c].replace(/^./u, (l) => l.toUpperCase())}
          pressionado={c === cor}
          onClick={() => onCor(c)}
          disabled={ocupado}
        />
      ))}
      <BotaoBarra onClick={onAnotar} disabled={ocupado} icone={Icones.lapis}>
        Anotar
      </BotaoBarra>
      <BotaoBarra onClick={onRemover} disabled={ocupado} icone={Icones.lixeira}>
        Remover
      </BotaoBarra>
    </BarraAcoes>
  );
}
