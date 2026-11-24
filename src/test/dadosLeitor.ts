/** Utilitários de teste para o backup (UC11): favoritos e inscrições previsíveis. */
import { Referencia } from '../dominio/biblia';
import { Favorito, FavoritoId } from '../dominio/estudo';
import { DataLocal, InscricaoId, InscricaoPlano, PlanoId } from '../dominio/planos';
import { canon } from './destaques';

export const idFavorito = (n: number) =>
  FavoritoId.de(`00000000-0000-7000-8000-00000000f${String(n).padStart(3, '0')}`);

/** Favorito em `versiculo` ("Jo 3:16"), criado em 2026-11-22 09:0n. */
export const favorito = (n: number, versiculo: string) =>
  Favorito.criar(
    idFavorito(n),
    Referencia.parse(versiculo, canon),
    new Date(Date.UTC(2026, 10, 22, 9, n)),
  );

export const idInscricao = (n: number) =>
  InscricaoId.de(`00000000-0000-7000-8000-00000000c${String(n).padStart(3, '0')}`);

/** Inscrição no plano de 31 dias, iniciada em 2026-11-01, com os dias concluídos. */
export const inscricao = (n: number, dias: number[] = [], plano = 'salmos-proverbios-31') =>
  InscricaoPlano.criar(idInscricao(n), PlanoId.de(plano), 31, DataLocal.iso('2026-11-01'), dias);
