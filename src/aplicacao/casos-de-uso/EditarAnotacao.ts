import type { Anotacao, AnotacaoId, ModoExibicao } from '../../dominio/estudo';
import { ErroAplicacao } from '../ErroAplicacao';
import type { AnotacaoRepository, Relogio } from '../portas';

export class AnotacaoInexistenteError extends ErroAplicacao {
  constructor(id: AnotacaoId) {
    super(`Anotação ${id} não existe.`);
  }
}

/** UC06 A1 — Editar conteúdo e/ou modo de exibição (RF05.4). */
export class EditarAnotacao {
  constructor(
    private readonly anotacoes: AnotacaoRepository,
    private readonly relogio: Relogio,
  ) {}

  async executar(id: AnotacaoId, conteudo: string, exibicao: ModoExibicao): Promise<Anotacao> {
    const atual = await this.anotacoes.porId(id);
    if (!atual) throw new AnotacaoInexistenteError(id);
    const editada = atual.editar(conteudo, exibicao, this.relogio.agora());
    await this.anotacoes.salvar(editada);
    return editada;
  }
}
