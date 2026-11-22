import type { PreferenciasRepository } from '../../aplicacao/portas';
import { Referencia, VersaoId, type Canon } from '../../dominio/biblia';
import { Preferencias } from '../../dominio/preferencias';
import type { BancoApp } from './BancoApp';

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
    });
  }
}
