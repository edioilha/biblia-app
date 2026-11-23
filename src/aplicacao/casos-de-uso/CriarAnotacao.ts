import type { Referencia } from '../../dominio/biblia';
import { Anotacao, AnotacaoId, type DestaqueId, type ModoExibicao } from '../../dominio/estudo';
import type { AnotacaoRepository, GeradorId, Relogio } from '../portas';

/** Onde a nota é criada: um versículo, ou um destaque (que começa em `versiculo`). */
export interface AlvoAnotacao {
  readonly versiculo: Referencia;
  readonly destaque: DestaqueId | null;
}

/** UC06 — Criar anotação num versículo ou destaque (RF05.1, RF05.2). */
export class CriarAnotacao {
  constructor(
    private readonly anotacoes: AnotacaoRepository,
    private readonly relogio: Relogio,
    private readonly gerador: GeradorId,
  ) {}

  async executar(alvo: AlvoAnotacao, conteudo: string, exibicao: ModoExibicao): Promise<Anotacao> {
    const nova = Anotacao.nova(
      AnotacaoId.de(this.gerador.novo()),
      alvo.versiculo,
      alvo.destaque,
      conteudo,
      exibicao,
      this.relogio.agora(),
    );
    await this.anotacoes.salvar(nova);
    return nova;
  }
}
