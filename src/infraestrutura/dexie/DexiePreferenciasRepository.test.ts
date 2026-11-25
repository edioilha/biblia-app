import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Canon, Referencia, VersaoId } from '../../dominio/biblia';
import { ConfiguracaoLeitura, Preferencias } from '../../dominio/preferencias';
import { BancoApp } from './BancoApp';
import { DexiePreferenciasRepository } from './DexiePreferenciasRepository';

const canon = new Canon();

describe('DexiePreferenciasRepository', () => {
  let db: BancoApp;
  let repo: DexiePreferenciasRepository;

  beforeEach(() => {
    db = new BancoApp(`teste-${crypto.randomUUID()}`);
    repo = new DexiePreferenciasRepository(db, canon);
  });
  afterEach(() => db.delete());

  it('retorna null na primeira execução', async () => {
    expect(await repo.obter()).toBeNull();
  });

  it('salva e restaura versão ativa e última posição', async () => {
    await repo.salvar(Preferencias.criar(VersaoId.de('BLIVRE'), Referencia.parse('Jo 3', canon)));
    const p = await repo.obter();
    expect(p?.versaoAtiva).toBe('BLIVRE');
    expect(p?.ultimaPosicao.chave()).toBe('JHN.3');
    expect(await db.preferencias.get('usuario')).toEqual({
      id: 'usuario',
      versaoAtiva: 'BLIVRE',
      ultimaPosicao: 'JHN.3',
      tema: 'CLARO',
      tamanhoFonte: 3,
      largura: 'ESTREITA',
    });
  });

  it('guarda tema, tamanho da fonte e largura da página (UC12, BL-01)', async () => {
    const leitura = ConfiguracaoLeitura.criar('SEPIA', 6, 'LARGA');
    await repo.salvar(
      Preferencias.criar(VersaoId.de('BLIVRE'), Referencia.parse('Jo 3', canon), leitura),
    );
    expect((await repo.obter())?.leitura).toEqual(leitura);
  });

  it('registro antigo (sem tema) ou com tema inválido usa a configuração padrão', async () => {
    await db.preferencias.put({ id: 'usuario', versaoAtiva: 'BLIVRE', ultimaPosicao: 'JHN.3' });
    expect((await repo.obter())?.leitura).toEqual(ConfiguracaoLeitura.padrao);
    await db.preferencias.put({
      id: 'usuario',
      versaoAtiva: 'BLIVRE',
      ultimaPosicao: 'JHN.3',
      tema: 'NEON',
      tamanhoFonte: 99,
    });
    const p = await repo.obter();
    expect(p?.leitura).toEqual(ConfiguracaoLeitura.padrao);
    expect(p?.ultimaPosicao.chave()).toBe('JHN.3');
  });

  it('registro sem largura (anterior ao BL-01) mantém tema e tamanho; largura inválida usa o padrão', async () => {
    const base = { id: 'usuario', versaoAtiva: 'BLIVRE', ultimaPosicao: 'JHN.3' } as const;
    await db.preferencias.put({ ...base, tema: 'ESCURO', tamanhoFonte: 5 });
    expect((await repo.obter())?.leitura).toEqual(ConfiguracaoLeitura.criar('ESCURO', 5));
    await db.preferencias.put({ ...base, tema: 'ESCURO', tamanhoFonte: 5, largura: 'GIGANTE' });
    expect((await repo.obter())?.leitura).toEqual(ConfiguracaoLeitura.padrao);
  });

  it('trata registro inválido como primeira execução', async () => {
    await db.preferencias.put({ id: 'usuario', versaoAtiva: 'BLIVRE', ultimaPosicao: 'XXX.1' });
    expect(await repo.obter()).toBeNull();
  });
});
