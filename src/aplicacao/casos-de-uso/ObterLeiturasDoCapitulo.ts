import type { Referencia } from '../../dominio/biblia';
import { DataLocal } from '../../dominio/planos';
import type { CatalogoPlanos, InscricaoRepository, Relogio } from '../portas';
import { planosSeguidos, type LeituraDoCapitulo } from './planosSeguidos';

/**
 * UC08 passo 3–4 — na leitura, os planos em andamento cuja leitura inclui o capítulo
 * aberto: a de hoje ou, se não, a do dia atrasado mais antigo. Alimenta a faixa do plano
 * com "Concluir dia".
 */
export class ObterLeiturasDoCapitulo {
  constructor(
    private readonly catalogo: CatalogoPlanos,
    private readonly inscricoes: InscricaoRepository,
    private readonly relogio: Relogio,
  ) {}

  async executar(capitulo: Referencia): Promise<LeituraDoCapitulo[]> {
    const hoje = DataLocal.de(this.relogio.agora());
    const { seguidos: lista } = await planosSeguidos(this.catalogo, this.inscricoes);
    return lista.flatMap(({ inscricao, plano }) => {
      if (inscricao.status !== 'EM_ANDAMENTO') return [];
      const diaHoje = inscricao.diaDe(hoje);
      if (diaHoje === null) return [];
      const candidatos = [diaHoje, ...inscricao.diasAtrasados(hoje)];
      const leitura = (n: number) => plano.dia(inscricao.diaDoPlano(n));
      const numero = candidatos.find((n) => leitura(n).contem(capitulo));
      return numero === undefined ? [] : [{ inscricao, plano, numero, dia: leitura(numero), hoje }];
    });
  }
}
