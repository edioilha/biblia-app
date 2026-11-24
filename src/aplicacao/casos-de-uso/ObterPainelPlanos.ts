import { DataLocal } from '../../dominio/planos';
import type { CatalogoPlanos, InscricaoRepository, Relogio } from '../portas';
import { planosSeguidos, type PainelPlanos } from './planosSeguidos';

/** UC08 passo 1–2 — planos seguidos e catálogo, com a data de hoje do leitor. */
export class ObterPainelPlanos {
  constructor(
    private readonly catalogo: CatalogoPlanos,
    private readonly inscricoes: InscricaoRepository,
    private readonly relogio: Relogio,
  ) {}

  async executar(): Promise<PainelPlanos> {
    const { planos, seguidos: lista } = await planosSeguidos(this.catalogo, this.inscricoes);
    const iniciados = new Set(lista.map((s) => s.plano.id));
    return {
      hoje: DataLocal.de(this.relogio.agora()),
      seguidos: lista,
      disponiveis: planos.filter((p) => !iniciados.has(p.id)),
    };
  }
}
