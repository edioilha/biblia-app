import { VersaoCorrompidaError } from '../../aplicacao/casos-de-uso';
import type { FonteVersao, LivroImportado } from '../../aplicacao/portas';
import { CodigoLivro, type Canon, type VersaoId } from '../../dominio/biblia';
import { FonteIndisponivelError } from './FonteEstatica';
import { converterLivro, DadosInvalidosError, type LivroOrigem } from './normalizar';

/** JSON canônico do Projeto-Euaggelion/biblia.data (ADR 0007), servido pelo GitHub. */
export const URL_BIBLIA_DATA =
  'https://raw.githubusercontent.com/Projeto-Euaggelion/biblia.data/main/data/canonical/';

/**
 * Fonte das versões instaláveis (UC09): baixa `<base><VERSAO>/<LIVRO>.json` e aplica a mesma
 * normalização e validação da versão embarcada (src/infraestrutura/fontes/normalizar.ts).
 */
export class FonteBibliaData implements FonteVersao {
  constructor(
    private readonly canon: Canon,
    private readonly baseUrl = URL_BIBLIA_DATA,
    private readonly buscar: typeof fetch = (...args) => fetch(...args),
  ) {}

  async carregarLivro(
    versao: VersaoId,
    livro: CodigoLivro,
    sinal?: AbortSignal,
  ): Promise<LivroImportado> {
    const url = `${this.baseUrl}${versao}/${livro.valor}.json`;
    const resposta = await this.buscar(url, sinal ? { signal: sinal } : {});
    if (!resposta.ok) throw new FonteIndisponivelError(`${url}: HTTP ${resposta.status}`);

    const { totalCapitulos } = this.canon.livro(livro);
    try {
      const origem = (await resposta.json()) as LivroOrigem;
      const convertido = converterLivro(origem, { codigo: livro.valor, totalCapitulos });
      return { livro: CodigoLivro.de(convertido.livro), capitulos: convertido.capitulos };
    } catch (erro) {
      // UC09 A2: JSON quebrado ou fora do cânon.
      if (erro instanceof DadosInvalidosError || erro instanceof SyntaxError) {
        throw new VersaoCorrompidaError(`${versao}/${livro.valor}: ${erro.message}`);
      }
      throw erro;
    }
  }
}
