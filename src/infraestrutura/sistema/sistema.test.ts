import { describe, expect, it } from 'vitest';
import { FavoritoId } from '../../dominio/estudo';
import { GeradorUuidV7 } from './GeradorUuidV7';
import { RelogioSistema } from './RelogioSistema';

describe('GeradorUuidV7', () => {
  it('gera UUIDs v7 válidos, únicos e em ordem de criação', () => {
    const gerador = new GeradorUuidV7();
    const ids = Array.from({ length: 50 }, () => gerador.novo());
    for (const id of ids) {
      expect(id[14]).toBe('7');
      expect(FavoritoId.de(id)).toBe(id);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
  });
});

describe('RelogioSistema', () => {
  it('devolve o instante atual', () => {
    const antes = Date.now();
    const agora = new RelogioSistema().agora().getTime();
    expect(agora).toBeGreaterThanOrEqual(antes);
    expect(agora).toBeLessThanOrEqual(Date.now());
  });
});
