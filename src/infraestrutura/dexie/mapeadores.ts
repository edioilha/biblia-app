/**
 * Conversão entre os registros gravados (docs/06 §6) e o domínio. Usada pelos repositórios
 * Dexie, pela leitura/gravação em bloco do backup e pelo arquivo de backup (UC11), que
 * guarda os mesmos registros. `*DeRegistro` lança erro de domínio se o registro for
 * inválido; os repositórios tratam como ausente.
 */
import { Referencia, VersaoId, type Canon } from '../../dominio/biblia';
import {
  Anotacao,
  AnotacaoId,
  CorDestaque,
  Destaque,
  DestaqueId,
  Favorito,
  FavoritoId,
  IntervaloTexto,
  ModoExibicao,
  PosicaoTexto,
} from '../../dominio/estudo';
import { DataLocal, InscricaoId, InscricaoPlano, PlanoId } from '../../dominio/planos';
import type {
  AnotacaoRegistro,
  DestaqueRegistro,
  FavoritoRegistro,
  InscricaoRegistro,
  PosicaoRegistro,
} from './BancoApp';

export function favoritoParaRegistro(f: Favorito): FavoritoRegistro {
  return {
    id: f.id,
    chave: f.referencia.chave(),
    livro: f.referencia.livro.valor,
    capitulo: f.referencia.capitulo,
    criadoEm: f.criadoEm,
  };
}

export function favoritoDeRegistro(r: FavoritoRegistro, canon: Canon): Favorito {
  return Favorito.criar(FavoritoId.de(r.id), Referencia.deChave(r.chave, canon), r.criadoEm);
}

export function destaqueParaRegistro(d: Destaque): DestaqueRegistro {
  const { inicio, fim } = d.intervalo;
  return {
    id: d.id,
    versaoId: d.versaoId,
    livro: d.capitulo.livro.valor,
    capitulo: d.capitulo.capitulo,
    inicio: [inicio.numero, inicio.offset],
    fim: [fim.numero, fim.offset],
    cor: d.cor,
    criadoEm: d.criadoEm,
  };
}

export function destaqueDeRegistro(r: DestaqueRegistro, canon: Canon): Destaque {
  const posicao = ([versiculo, offset]: PosicaoRegistro) =>
    PosicaoTexto.em(Referencia.deChave(`${r.livro}.${r.capitulo}.${versiculo}`, canon), offset);
  return Destaque.criar(
    DestaqueId.de(r.id),
    VersaoId.de(r.versaoId),
    IntervaloTexto.criar(posicao(r.inicio), posicao(r.fim)),
    CorDestaque.de(r.cor),
    r.criadoEm,
  );
}

export function anotacaoParaRegistro(a: Anotacao): AnotacaoRegistro {
  return {
    id: a.id,
    chave: a.referencia.chave(),
    livro: a.referencia.livro.valor,
    capitulo: a.referencia.capitulo,
    destaqueId: a.destaqueId,
    conteudo: a.conteudo,
    exibicao: a.exibicao,
    criadoEm: a.criadoEm,
    atualizadoEm: a.atualizadoEm,
  };
}

export function anotacaoDeRegistro(r: AnotacaoRegistro, canon: Canon): Anotacao {
  return Anotacao.reconstituir(
    AnotacaoId.de(r.id),
    Referencia.deChave(r.chave, canon),
    r.destaqueId === null ? null : DestaqueId.de(r.destaqueId),
    r.conteudo,
    ModoExibicao.de(r.exibicao),
    r.criadoEm,
    r.atualizadoEm,
  );
}

export function inscricaoParaRegistro(i: InscricaoPlano): InscricaoRegistro {
  return {
    id: i.id,
    planoId: i.planoId,
    totalDias: i.totalDias,
    inicio: i.inicio.paraIso(),
    diasConcluidos: [...i.diasConcluidos].sort((a, b) => a - b),
    diaInicial: i.diaInicial,
  };
}

export function inscricaoDeRegistro(r: InscricaoRegistro): InscricaoPlano {
  return InscricaoPlano.criar(
    InscricaoId.de(r.id),
    PlanoId.de(r.planoId),
    r.totalDias,
    DataLocal.iso(r.inicio),
    r.diasConcluidos,
    r.diaInicial ?? 1,
  );
}

/** Para os repositórios: registro inválido (ex.: gravado por versão antiga) = ausente. */
export function ouNulo<T>(converter: () => T): T | null {
  try {
    return converter();
  } catch {
    return null;
  }
}
