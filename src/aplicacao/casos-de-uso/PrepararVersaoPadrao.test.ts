import { describe, expect, it } from 'vitest';
import { Canon, VersaoId, type CodigoLivro } from '../../dominio/biblia';
import type { FonteVersaoEmbarcada, LivroImportado } from '../portas';
import { FonteSintetica, livroSintetico, TextoBiblicoEmMemoria } from '../../test/fakes';
import {
  PrepararVersaoPadrao,
  VersaoCorrompidaError,
  type ProgressoPreparacao,
} from './PrepararVersaoPadrao';

const canon = new Canon();
const blivre = VersaoId.de('BLIVRE');

describe('PrepararVersaoPadrao', () => {
  it('importa os 66 livros na primeira execução, informando o progresso', async () => {
    const fonte = new FonteSintetica(canon);
    const texto = new TextoBiblicoEmMemoria(canon);
    const uc = new PrepararVersaoPadrao(canon, fonte, texto, blivre);
    const progresso: ProgressoPreparacao[] = [];

    expect(await uc.necessaria()).toBe(true);
    await uc.executar((p) => progresso.push(p));

    expect(await uc.necessaria()).toBe(false);
    expect(fonte.carregados).toBe(66);
    expect(progresso).toHaveLength(66);
    expect(progresso.at(-1)).toEqual({ concluidos: 66, total: 66 });
    expect(texto.versoes.get(blivre)?.size).toBe(66);
  });

  it('é idempotente', async () => {
    const fonte = new FonteSintetica(canon);
    const uc = new PrepararVersaoPadrao(canon, fonte, new TextoBiblicoEmMemoria(canon), blivre);
    await uc.executar();
    await uc.executar();
    expect(fonte.carregados).toBe(66);
  });

  it('chamadas concorrentes compartilham a mesma importação', async () => {
    const fonte = new FonteSintetica(canon);
    const uc = new PrepararVersaoPadrao(canon, fonte, new TextoBiblicoEmMemoria(canon), blivre);
    await Promise.all([uc.executar(), uc.executar()]);
    expect(fonte.carregados).toBe(66);
  });

  it('rejeita livro corrompido sem importar nada', async () => {
    const corrompida: FonteVersaoEmbarcada = {
      async carregarLivro(_v: VersaoId, livro: CodigoLivro): Promise<LivroImportado> {
        const l = livroSintetico(canon, livro.valor);
        return livro.valor === 'JHN' ? { ...l, capitulos: l.capitulos.slice(1) } : l;
      },
    };
    const texto = new TextoBiblicoEmMemoria(canon);
    const uc = new PrepararVersaoPadrao(canon, corrompida, texto, blivre);

    await expect(uc.executar()).rejects.toThrow(VersaoCorrompidaError);
    expect(await texto.possuiVersao(blivre)).toBe(false);
  });
});
