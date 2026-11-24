import { BackupInvalidoError } from '../../aplicacao/casos-de-uso';
import type { ArquivoBackup, FormatoBackup } from '../../aplicacao/portas';
import type { Canon } from '../../dominio/biblia';
import type { DadosDoLeitor } from '../../dominio/backup';
import {
  anotacaoDeRegistro,
  anotacaoParaRegistro,
  destaqueDeRegistro,
  destaqueParaRegistro,
  favoritoDeRegistro,
  favoritoParaRegistro,
  inscricaoDeRegistro,
  inscricaoParaRegistro,
} from '../dexie/mapeadores';

/** Identifica o arquivo e a versão do formato (UC11). */
export const APP_BACKUP = 'biblia-app';
export const FORMATO_BACKUP = 1;

/** Campos de data gravados em ISO 8601 no arquivo (no banco são Date). */
const DATAS = ['criadoEm', 'atualizadoEm'] as const;

/**
 * Arquivo de backup em JSON (formato 1): os mesmos registros do banco (docs/06 §6), com as
 * datas em ISO 8601. Na leitura, cada item passa pelas regras do domínio; um item inválido
 * recusa o arquivo inteiro, para não importar dados pela metade.
 */
export class BackupJson implements FormatoBackup {
  constructor(private readonly canon: Canon) {}

  serializar(dados: DadosDoLeitor, exportadoEm: Date): string {
    return JSON.stringify(
      {
        app: APP_BACKUP,
        formato: FORMATO_BACKUP,
        exportadoEm: exportadoEm.toISOString(),
        favoritos: dados.favoritos.map(favoritoParaRegistro),
        destaques: dados.destaques.map(destaqueParaRegistro),
        anotacoes: dados.anotacoes.map(anotacaoParaRegistro),
        inscricoes: dados.inscricoes.map(inscricaoParaRegistro),
      },
      null,
      2,
    );
  }

  ler(conteudo: string): ArquivoBackup {
    let json: unknown;
    try {
      json = JSON.parse(conteudo);
    } catch {
      throw new BackupInvalidoError('O arquivo não é um backup do Bíblia App (JSON inválido).');
    }
    if (!eObjeto(json) || json['app'] !== APP_BACKUP) {
      throw new BackupInvalidoError('O arquivo não é um backup do Bíblia App.');
    }
    const formato = json['formato'];
    if (typeof formato !== 'number' || formato > FORMATO_BACKUP || formato < 1) {
      throw new BackupInvalidoError(
        'Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.',
      );
    }
    const exportadoEm = new Date(String(json['exportadoEm']));
    if (Number.isNaN(exportadoEm.getTime())) {
      throw new BackupInvalidoError('O backup não tem a data de exportação.');
    }

    const itens = <T>(campo: string, nome: string, converter: (r: never) => T): T[] => {
      const lista = json[campo] ?? [];
      if (!Array.isArray(lista))
        throw new BackupInvalidoError(`O backup tem dados inválidos em ${nome}.`);
      return lista.map((item: unknown, i) => {
        try {
          if (!eObjeto(item)) throw new Error('não é um objeto');
          return converter(comDatas(item) as never);
        } catch (erro) {
          throw new BackupInvalidoError(
            `O backup tem dados inválidos em ${nome} (item ${i + 1}: ${(erro as Error).message})`,
          );
        }
      });
    };

    return {
      exportadoEm,
      dados: {
        favoritos: itens('favoritos', 'favoritos', (r) => favoritoDeRegistro(r, this.canon)),
        destaques: itens('destaques', 'destaques', (r) => destaqueDeRegistro(r, this.canon)),
        anotacoes: itens('anotacoes', 'anotações', (r) => anotacaoDeRegistro(r, this.canon)),
        inscricoes: itens('inscricoes', 'planos', (r) => inscricaoDeRegistro(r)),
      },
    };
  }
}

function eObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * Converte as datas ISO em Date. Ausente ou inválida vira data inválida, que o domínio
 * recusa com uma mensagem clara (campos que o tipo não usa são ignorados).
 */
function comDatas(item: Record<string, unknown>): Record<string, unknown> {
  const copia = { ...item };
  for (const campo of DATAS) copia[campo] = new Date(String(copia[campo]));
  return copia;
}
