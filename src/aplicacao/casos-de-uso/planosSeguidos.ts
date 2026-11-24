import type {
  DataLocal,
  DiaPlano,
  InscricaoId,
  InscricaoPlano,
  PlanoLeitura,
} from '../../dominio/planos';
import { ErroAplicacao } from '../ErroAplicacao';
import type { CatalogoPlanos, InscricaoRepository } from '../portas';

export class PlanoInexistenteError extends ErroAplicacao {
  constructor(id: string) {
    super(`O plano "${id}" não existe.`);
  }
}

export class InscricaoInexistenteError extends ErroAplicacao {
  constructor(id: string) {
    super(`Inscrição ${id} não existe.`);
  }
}

export class PlanoJaIniciadoError extends ErroAplicacao {
  constructor(nome: string) {
    super(`O plano "${nome}" já está em andamento.`);
  }
}

/** Inscrição com o plano dela (o que a tela precisa para mostrar as leituras). */
export interface PlanoSeguido {
  readonly inscricao: InscricaoPlano;
  readonly plano: PlanoLeitura;
}

/** UC08 passo 1 — o que a tela de Planos mostra. */
export interface PainelPlanos {
  readonly hoje: DataLocal;
  /** Planos seguidos (em andamento primeiro), na ordem do catálogo. */
  readonly seguidos: readonly PlanoSeguido[];
  /** RF06.1 — planos do catálogo ainda não iniciados. */
  readonly disponiveis: readonly PlanoLeitura[];
}

/** Leitura de um plano que inclui o capítulo aberto (faixa da leitura, wireframe tela 1). */
export interface LeituraDoCapitulo extends PlanoSeguido {
  /** Dia do leitor (o que ele conclui) e a leitura do plano desse dia. */
  readonly numero: number;
  readonly dia: DiaPlano;
  readonly hoje: DataLocal;
}

/** Junta inscrições e planos; inscrições de planos que saíram do catálogo ficam de fora. */
export async function planosSeguidos(
  catalogo: CatalogoPlanos,
  inscricoes: InscricaoRepository,
): Promise<{ planos: PlanoLeitura[]; seguidos: PlanoSeguido[] }> {
  const [planos, todas] = await Promise.all([catalogo.todos(), inscricoes.todas()]);
  const porPlano = new Map(todas.map((i) => [i.planoId, i]));
  const lista = planos.flatMap((plano) => {
    const inscricao = porPlano.get(plano.id);
    return inscricao ? [{ inscricao, plano }] : [];
  });
  const ordem = (s: PlanoSeguido) => (s.inscricao.status === 'EM_ANDAMENTO' ? 0 : 1);
  return { planos, seguidos: lista.sort((a, b) => ordem(a) - ordem(b)) };
}

/** Base dos casos de uso que alteram uma inscrição existente. */
export abstract class AlterarInscricao {
  constructor(protected readonly inscricoes: InscricaoRepository) {}

  protected async alterar(
    id: InscricaoId,
    mudar: (i: InscricaoPlano) => InscricaoPlano,
  ): Promise<InscricaoPlano> {
    const atual = await this.inscricoes.porId(id);
    if (!atual) throw new InscricaoInexistenteError(id);
    const nova = mudar(atual);
    if (nova !== atual) await this.inscricoes.salvar(nova);
    return nova;
  }
}
