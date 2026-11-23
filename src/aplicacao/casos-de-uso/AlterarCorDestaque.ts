import type { CorDestaque, Destaque, DestaqueId } from '../../dominio/estudo';
import { ErroAplicacao } from '../ErroAplicacao';
import type { DestaqueRepository, GeradorId, TextoBiblicoRepository } from '../portas';
import { contextoDestaques } from './contextoDestaques';

export class DestaqueInexistenteError extends ErroAplicacao {
  constructor(id: DestaqueId) {
    super(`Destaque ${id} não existe.`);
  }
}

/**
 * Alterar a cor de um destaque (RF04.5, RF09.6). Segue a mesma regra de sobreposição:
 * pode fundir com vizinhos da nova cor. Devolve o destaque resultante.
 */
export class AlterarCorDestaque {
  constructor(
    private readonly texto: TextoBiblicoRepository,
    private readonly destaques: DestaqueRepository,
    private readonly gerador: GeradorId,
  ) {}

  private deps() {
    return { texto: this.texto, destaques: this.destaques, gerador: this.gerador };
  }

  async executar(id: DestaqueId, cor: CorDestaque): Promise<Destaque> {
    const atual = await this.destaques.porId(id);
    if (!atual) throw new DestaqueInexistenteError(id);
    if (atual.cor === cor) return atual;

    const { regras, existentes } = await contextoDestaques(
      this.deps(),
      atual.versaoId,
      atual.capitulo,
    );
    const { destaque, alteracoes } = regras.aplicar(atual.comCor(cor), existentes);
    await this.destaques.aplicar(alteracoes);
    return destaque;
  }
}
