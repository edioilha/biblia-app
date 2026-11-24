import { describe, expect, it, vi } from 'vitest';
import { pedirArmazenamentoPersistente } from './persistencia';

describe('pedirArmazenamentoPersistente (BL-05)', () => {
  it('pede só se ainda não for persistente', async () => {
    const persist = vi.fn(async () => true);
    expect(await pedirArmazenamentoPersistente({ persist, persisted: async () => false })).toBe(
      true,
    );
    expect(persist).toHaveBeenCalledOnce();

    persist.mockClear();
    expect(await pedirArmazenamentoPersistente({ persist, persisted: async () => true })).toBe(
      true,
    );
    expect(persist).not.toHaveBeenCalled();
  });

  it('sem a API ou com erro, não faz nada', async () => {
    expect(await pedirArmazenamentoPersistente(undefined)).toBe(false);
    const falha = async (): Promise<boolean> => {
      throw new Error('negado');
    };
    expect(
      await pedirArmazenamentoPersistente({ persist: falha, persisted: async () => false }),
    ).toBe(false);
  });
});
