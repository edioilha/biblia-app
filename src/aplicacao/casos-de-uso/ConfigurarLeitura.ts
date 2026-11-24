import type { Canon, VersaoId } from '../../dominio/biblia';
import { ConfiguracaoLeitura, Preferencias } from '../../dominio/preferencias';
import type { PreferenciasRepository } from '../portas';
import { primeiroCapitulo } from './ObterPosicaoInicial';

/** UC12 — Configurar leitura: tema e tamanho da fonte (RF01.7), salvos nas preferências. */
export class ConfigurarLeitura {
  constructor(
    private readonly canon: Canon,
    private readonly preferencias: PreferenciasRepository,
    private readonly versaoPadrao: VersaoId,
  ) {}

  /** A configuração atual; a padrão (claro, tamanho 3) na primeira execução. */
  async obter(): Promise<ConfiguracaoLeitura> {
    return (await this.preferencias.obter())?.leitura ?? ConfiguracaoLeitura.padrao;
  }

  async executar(leitura: ConfiguracaoLeitura): Promise<void> {
    const prefs = await this.preferencias.obter();
    const novas = prefs
      ? prefs.comLeitura(leitura)
      : Preferencias.criar(this.versaoPadrao, primeiroCapitulo(this.canon), leitura);
    if (novas !== prefs) await this.preferencias.salvar(novas);
  }
}
