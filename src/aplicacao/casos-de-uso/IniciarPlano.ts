import { InscricaoId, InscricaoPlano, type DataLocal, type PlanoId } from '../../dominio/planos';
import type { CatalogoPlanos, GeradorId, InscricaoRepository } from '../portas';
import { PlanoInexistenteError, PlanoJaIniciadoError } from './planosSeguidos';

/**
 * UC07 — Iniciar plano (RF06.2) com a data de início escolhida (hoje ou outra). Um plano
 * por vez: em andamento, não inicia de novo; concluído, recomeça do zero. `diaInicial` é a
 * leitura do plano pela qual começar (UC07 A5); padrão, o dia 1.
 */
export class IniciarPlano {
  constructor(
    private readonly catalogo: CatalogoPlanos,
    private readonly inscricoes: InscricaoRepository,
    private readonly gerador: GeradorId,
  ) {}

  async executar(planoId: PlanoId, inicio: DataLocal, diaInicial = 1): Promise<InscricaoPlano> {
    const plano = await this.catalogo.porId(planoId);
    if (!plano) throw new PlanoInexistenteError(planoId);
    const existente = await this.inscricoes.porPlano(planoId);
    if (existente?.status === 'EM_ANDAMENTO') throw new PlanoJaIniciadoError(plano.nome);
    if (existente) await this.inscricoes.remover(existente.id);

    const nova = InscricaoPlano.criar(
      InscricaoId.de(this.gerador.novo()),
      plano.id,
      plano.duracaoDias,
      inicio,
      [],
      diaInicial,
    );
    await this.inscricoes.salvar(nova);
    return nova;
  }
}
