import type { Anotacao, Destaque, Favorito } from '../estudo';
import type { InscricaoPlano } from '../planos';

/** Tudo o que o leitor produz e o backup leva (RF08.1). O texto bíblico não entra. */
export interface DadosDoLeitor {
  readonly favoritos: readonly Favorito[];
  readonly destaques: readonly Destaque[];
  readonly anotacoes: readonly Anotacao[];
  readonly inscricoes: readonly InscricaoPlano[];
}

export const DadosDoLeitor = {
  vazio: (): DadosDoLeitor => ({ favoritos: [], destaques: [], anotacoes: [], inscricoes: [] }),
  /** Quantidade de cada tipo, na ordem favoritos, destaques, anotações, planos. */
  totais: (d: DadosDoLeitor) => ({
    favoritos: d.favoritos.length,
    destaques: d.destaques.length,
    anotacoes: d.anotacoes.length,
    inscricoes: d.inscricoes.length,
  }),
};

/** O que muda no armazenamento ao importar: gravar (novos ou atualizados) e remover. */
export interface AlteracoesImportacao extends DadosDoLeitor {
  /** Inscrições substituídas por outra do mesmo plano com mais progresso. */
  readonly inscricoesRemovidas: readonly InscricaoPlano['id'][];
}

/** Para cada tipo: novos, atualizados e mantidos (o leitor já tinha igual ou mais recente). */
export interface ContagemImportacao {
  readonly novos: number;
  readonly atualizados: number;
  readonly mantidos: number;
}

export interface ResumoImportacao {
  readonly favoritos: ContagemImportacao;
  readonly destaques: ContagemImportacao & {
    /** Novos que se sobrepõem a um destaque que o leitor já tem: não entram (RF04). */
    readonly sobrepostos: number;
  };
  readonly anotacoes: ContagemImportacao;
  readonly inscricoes: ContagemImportacao;
}

/**
 * UC11 — importar **juntando**: o que o leitor já tem fica; o que vem do arquivo é
 * acrescentado. Nada é apagado, exceto uma inscrição trocada pela do arquivo. Regras:
 * - favorito: um por versículo; já existe (mesmo id ou versículo) → mantém o atual;
 * - anotação: mesmo id → fica a editada por último (`atualizadoEm`);
 * - destaque: mesmo id → mantém o atual; novo que se sobrepõe a outro da mesma versão e
 *   capítulo → não entra (os destaques nunca se sobrepõem);
 * - plano: um por plano; já seguido → fica o de mais dias concluídos (empate: o atual).
 */
export function mesclarDados(
  atuais: DadosDoLeitor,
  arquivo: DadosDoLeitor,
): { alteracoes: AlteracoesImportacao; resumo: ResumoImportacao } {
  const favoritos = mesclarFavoritos(atuais.favoritos, arquivo.favoritos);
  const destaques = mesclarDestaques(atuais.destaques, arquivo.destaques);
  const anotacoes = mesclarAnotacoes(atuais.anotacoes, arquivo.anotacoes);
  const inscricoes = mesclarInscricoes(atuais.inscricoes, arquivo.inscricoes);
  return {
    alteracoes: {
      favoritos: favoritos.gravar,
      destaques: destaques.gravar,
      anotacoes: anotacoes.gravar,
      inscricoes: inscricoes.gravar,
      inscricoesRemovidas: inscricoes.remover,
    },
    resumo: {
      favoritos: favoritos.contagem,
      destaques: { ...destaques.contagem, sobrepostos: destaques.sobrepostos },
      anotacoes: anotacoes.contagem,
      inscricoes: inscricoes.contagem,
    },
  };
}

const contador = () => ({ novos: 0, atualizados: 0, mantidos: 0 });

function mesclarFavoritos(atuais: readonly Favorito[], arquivo: readonly Favorito[]) {
  const ids = new Set<string>(atuais.map((f) => f.id));
  const versiculos = new Set(atuais.map((f) => f.referencia.chave()));
  const gravar: Favorito[] = [];
  const contagem = contador();
  for (const f of arquivo) {
    const chave = f.referencia.chave();
    if (ids.has(f.id) || versiculos.has(chave)) {
      contagem.mantidos++;
      continue;
    }
    ids.add(f.id);
    versiculos.add(chave);
    gravar.push(f);
    contagem.novos++;
  }
  return { gravar, contagem };
}

function mesclarAnotacoes(atuais: readonly Anotacao[], arquivo: readonly Anotacao[]) {
  const porId = new Map<string, Anotacao>(atuais.map((a) => [a.id, a]));
  const gravar: Anotacao[] = [];
  const contagem = contador();
  for (const a of arquivo) {
    const atual = porId.get(a.id);
    if (!atual) contagem.novos++;
    else if (a.atualizadoEm > atual.atualizadoEm) contagem.atualizados++;
    else {
      contagem.mantidos++;
      continue;
    }
    porId.set(a.id, a);
    gravar.push(a);
  }
  return { gravar, contagem };
}

function mesclarDestaques(atuais: readonly Destaque[], arquivo: readonly Destaque[]) {
  const ids = new Set<string>(atuais.map((d) => d.id));
  // Por versão e capítulo, para comparar só intervalos do mesmo texto.
  const porCapitulo = new Map<string, Destaque[]>();
  const chave = (d: Destaque) => `${d.versaoId} ${d.capitulo.chave()}`;
  const guardar = (d: Destaque) => {
    const lista = porCapitulo.get(chave(d)) ?? [];
    lista.push(d);
    porCapitulo.set(chave(d), lista);
  };
  atuais.forEach(guardar);

  const gravar: Destaque[] = [];
  const contagem = contador();
  let sobrepostos = 0;
  for (const d of arquivo) {
    if (ids.has(d.id)) {
      contagem.mantidos++;
      continue;
    }
    if ((porCapitulo.get(chave(d)) ?? []).some((o) => o.intervalo.sobrepoe(d.intervalo))) {
      sobrepostos++;
      continue;
    }
    ids.add(d.id);
    guardar(d);
    gravar.push(d);
    contagem.novos++;
  }
  return { gravar, contagem, sobrepostos };
}

function mesclarInscricoes(atuais: readonly InscricaoPlano[], arquivo: readonly InscricaoPlano[]) {
  const porPlano = new Map<string, InscricaoPlano>(atuais.map((i) => [i.planoId, i]));
  const gravar: InscricaoPlano[] = [];
  const remover: InscricaoPlano['id'][] = [];
  const contagem = contador();
  for (const i of arquivo) {
    const atual = porPlano.get(i.planoId);
    if (!atual) contagem.novos++;
    else if (i.diasConcluidos.size > atual.diasConcluidos.size) {
      contagem.atualizados++;
      if (atual.id !== i.id) remover.push(atual.id);
    } else {
      contagem.mantidos++;
      continue;
    }
    porPlano.set(i.planoId, i);
    gravar.push(i);
  }
  return { gravar, remover, contagem };
}
