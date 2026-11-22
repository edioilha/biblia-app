import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Canon, Referencia, VersaoId } from '../../dominio/biblia';
import { Preferencias } from '../../dominio/preferencias';
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
    });
  });

  it('trata registro inválido como primeira execução', async () => {
    await db.preferencias.put({ id: 'usuario', versaoAtiva: 'BLIVRE', ultimaPosicao: 'XXX.1' });
    expect(await repo.obter()).toBeNull();
  });
});
