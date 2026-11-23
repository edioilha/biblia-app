import * as Comlink from 'comlink';
import type { ServicoBusca } from '../../aplicacao/portas';
import type { Canon, VersaoId } from '../../dominio/biblia';
import type { ConsultaBusca, Pagina, ResultadoBusca } from '../../dominio/busca';
import type { ApiBusca } from './busca.worker';
import { consultaParaDTO, paginaDeDTO } from './dto';

/**
 * Adapter de `ServicoBusca` na thread principal: conversa com o Web Worker via Comlink.
 * O worker só é criado na primeira chamada.
 */
export class ServicoBuscaWorker implements ServicoBusca {
  private api: Comlink.Remote<ApiBusca> | null = null;

  constructor(
    private readonly canon: Canon,
    private readonly criarWorker: () => Worker,
  ) {}

  preparar(versao: VersaoId): Promise<void> {
    return this.remoto().preparar(versao);
  }

  async buscar(versao: VersaoId, consulta: ConsultaBusca): Promise<Pagina<ResultadoBusca>> {
    const dto = await this.remoto().buscar(versao, consultaParaDTO(consulta));
    return paginaDeDTO(dto, this.canon);
  }

  private remoto(): Comlink.Remote<ApiBusca> {
    this.api ??= Comlink.wrap<ApiBusca>(this.criarWorker());
    return this.api;
  }
}
