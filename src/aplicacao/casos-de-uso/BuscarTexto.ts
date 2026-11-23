import type { VersaoId } from '../../dominio/biblia';
import { Pagina, type ConsultaBusca, type ResultadoBusca } from '../../dominio/busca';
import type { ServicoBusca } from '../portas';

/** UC03 — Buscar texto na versão ativa (RF02). Abaixo do termo mínimo, página vazia. */
export class BuscarTexto {
  constructor(
    private readonly servico: ServicoBusca,
    private readonly versao: VersaoId,
  ) {}

  async executar(consulta: ConsultaBusca): Promise<Pagina<ResultadoBusca>> {
    if (!consulta.pesquisavel) return Pagina.vazia(consulta.tamanhoPagina);
    return this.servico.buscar(this.versao, consulta);
  }
}
