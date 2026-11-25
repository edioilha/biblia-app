import type { PreferenciasRepository } from '../../aplicacao/portas';
import { Referencia, VersaoId, type Canon } from '../../dominio/biblia';
import { ConfiguracaoLeitura, LarguraPagina, Preferencias, Tema } from '../../dominio/preferencias';
import type { BancoApp, PreferenciasRegistro } from './BancoApp';

export class DexiePreferenciasRepository implements PreferenciasRepository {
  constructor(
    private readonly db: BancoApp,
    private readonly canon: Canon,
  ) {}

  async obter(): Promise<Preferencias | null> {
    const registro = await this.db.preferencias.get('usuario');
    if (!registro) return null;
    try {
      return Preferencias.criar(
        VersaoId.de(registro.versaoAtiva),
        Referencia.deChave(registro.ultimaPosicao, this.canon),
        this.leitura(registro),
      );
    } catch {
      // Registro inválido (ex.: gravado por versão antiga): trata como primeira execução.
      return null;
    }
  }

  async salvar(p: Preferencias): Promise<void> {
    await this.db.preferencias.put({
      id: 'usuario',
      versaoAtiva: p.versaoAtiva,
      ultimaPosicao: p.ultimaPosicao.chave(),
      tema: p.leitura.tema,
      tamanhoFonte: p.leitura.tamanhoFonte,
      largura: p.leitura.largura,
    });
  }

  /**
   * Tema, tamanho ou largura ausente (registro antigo) usa o padrão daquele campo; algum
   * inválido descarta só a configuração de leitura, sem perder a versão e a posição.
   */
  private leitura({ tema, tamanhoFonte, largura }: PreferenciasRegistro): ConfiguracaoLeitura {
    const padrao = ConfiguracaoLeitura.padrao;
    try {
      return ConfiguracaoLeitura.criar(
        tema === undefined ? padrao.tema : Tema.de(tema),
        tamanhoFonte ?? padrao.tamanhoFonte,
        largura === undefined ? padrao.largura : LarguraPagina.de(largura),
      );
    } catch {
      return padrao;
    }
  }
}
