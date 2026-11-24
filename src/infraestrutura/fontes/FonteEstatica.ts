import type { FonteVersao, LivroImportado } from '../../aplicacao/portas';
import { CodigoLivro, type VersaoId } from '../../dominio/biblia';

/** Formato gerado por scripts/dados (npm run dados:blivre). */
interface LivroEmbarcado {
  formato: number;
  livro: string;
  capitulos: [number, string][][];
}

const FORMATO_SUPORTADO = 1;

export class FonteIndisponivelError extends Error {}

/**
 * Lê os livros da versão embarcada em `<base>dados/<VERSAO>/<LIVRO>.json`.
 * Os arquivos estão no precache do service worker, então funciona offline.
 */
export class FonteEstatica implements FonteVersao {
  constructor(
    private readonly baseUrl: string,
    private readonly buscar: typeof fetch = (...args) => fetch(...args),
  ) {}

  async carregarLivro(versao: VersaoId, livro: CodigoLivro): Promise<LivroImportado> {
    const url = `${this.baseUrl}dados/${versao}/${livro.valor}.json`;
    const resposta = await this.buscar(url);
    if (!resposta.ok) throw new FonteIndisponivelError(`${url}: HTTP ${resposta.status}`);

    const dados = (await resposta.json()) as LivroEmbarcado;
    if (dados.formato !== FORMATO_SUPORTADO) {
      throw new FonteIndisponivelError(`${url}: formato ${dados.formato} não suportado.`);
    }
    return { livro: CodigoLivro.de(dados.livro), capitulos: dados.capitulos };
  }
}
