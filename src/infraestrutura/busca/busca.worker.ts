import * as Comlink from 'comlink';
import { Canon } from '../../dominio/biblia';
import { BancoApp } from '../dexie/BancoApp';
import { consultaDeDTO, paginaParaDTO, type ConsultaDTO, type PaginaDTO } from './dto';
import { MotorBusca } from './MotorBusca';

/**
 * Web Worker da busca (ADR 0005): lê o texto da versão no IndexedDB, monta o índice em
 * memória (uma vez por versão) e responde às consultas sem travar a interface.
 */
const canon = new Canon();
const db = new BancoApp();
const motores = new Map<string, Promise<MotorBusca>>();

function motor(versao: string): Promise<MotorBusca> {
  let m = motores.get(versao);
  if (!m) {
    m = db.capitulos
      .where('versaoId')
      .equals(versao)
      .toArray()
      .then((capitulos) => {
        if (capitulos.length === 0) throw new Error(`Versão ${versao} ainda não importada.`);
        return MotorBusca.construir(canon, capitulos);
      });
    // Falhou (ex.: versão ainda importando): a próxima chamada tenta de novo.
    m.catch(() => motores.delete(versao));
    motores.set(versao, m);
  }
  return m;
}

const api = {
  async preparar(versao: string): Promise<void> {
    await motor(versao);
  },
  /** Versão removida (ou instalação desfeita): o próximo uso lê o banco de novo. */
  descartar(versao: string): void {
    motores.delete(versao);
  },
  async buscar(versao: string, consulta: ConsultaDTO): Promise<PaginaDTO> {
    const m = await motor(versao);
    return paginaParaDTO(m.buscar(consultaDeDTO(consulta, canon)));
  },
};

export type ApiBusca = typeof api;

Comlink.expose(api);
