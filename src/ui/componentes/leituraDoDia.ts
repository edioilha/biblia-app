import type { Canon } from '../../dominio/biblia';
import type { DiaPlano } from '../../dominio/planos';

/**
 * Texto da leitura de um dia: "Juízes 4–6", "Gênesis 50; Êxodo 1–2",
 * "Salmos 1, 31, 61, 91, 121; Provérbios 1".
 */
export function descreverLeitura(dia: DiaPlano, canon: Canon): string {
  const porLivro: { nome: string; partes: string[] }[] = [];
  for (const s of dia.sequencias()) {
    const nome = canon.livro(s.livro).nome;
    const parte = s.de === s.ate ? `${s.de}` : `${s.de}–${s.ate}`;
    const ultimo = porLivro.at(-1);
    if (ultimo?.nome === nome) ultimo.partes.push(parte);
    else porLivro.push({ nome, partes: [parte] });
  }
  return porLivro.map((l) => `${l.nome} ${l.partes.join(', ')}`).join('; ');
}
