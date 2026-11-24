/**
 * BL-05 — pede ao navegador armazenamento persistente (StorageManager.persist), para que
 * os dados do leitor não sejam apagados quando o aparelho ficar sem espaço. O navegador
 * decide (Chrome pelo uso do site; Firefox pode perguntar uma vez; Safari ignora). Sem a
 * API, ou se falhar, não faz nada: o app funciona igual.
 */
export async function pedirArmazenamentoPersistente(
  armazenamento: Pick<StorageManager, 'persist' | 'persisted'> | undefined = globalThis.navigator
    ?.storage,
): Promise<boolean> {
  try {
    if (!armazenamento?.persist || !armazenamento.persisted) return false;
    if (await armazenamento.persisted()) return true;
    return await armazenamento.persist();
  } catch {
    return false;
  }
}
