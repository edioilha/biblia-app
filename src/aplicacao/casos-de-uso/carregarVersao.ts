import type { Canon, Livro, VersaoId } from '../../dominio/biblia';
import { ErroAplicacao } from '../ErroAplicacao';
import type { FonteVersao, LivroImportado } from '../portas';

export class VersaoCorrompidaError extends ErroAplicacao {}

export interface ProgressoCarga {
  readonly concluidos: number;
  readonly total: number;
}

interface OpcoesCarga {
  /** Downloads simultâneos (o navegador limita conexões por servidor). */
  readonly concorrencia?: number;
  readonly aoProgredir?: ((p: ProgressoCarga) => void) | undefined;
  readonly sinal?: AbortSignal | undefined;
}

/**
 * Carrega os 66 livros da versão pela fonte e valida cada um contra o cânon (código e total
 * de capítulos). Usado na versão embarcada (RF07.1) e na instalação (UC09 passos 3–4).
 * Falha no primeiro erro, sem esperar os demais downloads.
 */
export async function carregarVersao(
  canon: Canon,
  fonte: FonteVersao,
  versao: VersaoId,
  { concorrencia = Infinity, aoProgredir, sinal }: OpcoesCarga = {},
): Promise<LivroImportado[]> {
  const livros = canon.livros();
  const importados: LivroImportado[] = new Array<LivroImportado>(livros.length);
  let proximo = 0;
  let concluidos = 0;
  let falhou = false;

  const trabalhador = async () => {
    try {
      while (!falhou && proximo < livros.length) {
        sinal?.throwIfAborted();
        const i = proximo++;
        const livro = livros[i] as Livro;
        const importado = await fonte.carregarLivro(versao, livro.codigo, sinal);
        validar(versao, importado, livro);
        importados[i] = importado;
        aoProgredir?.({ concluidos: ++concluidos, total: livros.length });
      }
    } catch (erro) {
      falhou = true; // os outros trabalhadores param no próximo livro
      throw erro;
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concorrencia, livros.length) }, () => trabalhador()),
  );
  return importados;
}

function validar(versao: VersaoId, importado: LivroImportado, livro: Livro): void {
  if (
    importado.livro.valor !== livro.codigo.valor ||
    importado.capitulos.length !== livro.totalCapitulos
  ) {
    throw new VersaoCorrompidaError(
      `${versao}/${livro.codigo.valor}: esperado ${livro.totalCapitulos} capítulos de ` +
        `${livro.codigo.valor}, recebido ${importado.capitulos.length} de ${importado.livro.valor}.`,
    );
  }
}
