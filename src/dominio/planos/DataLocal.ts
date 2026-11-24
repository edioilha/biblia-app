import { ErroDominio } from '../compartilhado/ErroDominio';

export class DataInvalidaError extends ErroDominio {}

const DIA_MS = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/u;

/**
 * Dia do calendário do leitor, sem hora nem fuso (value object). Os planos contam dias de
 * calendário: o "dia 2" começa à meia-noite local, não 24 h depois do início. As contas
 * usam UTC por dentro, então horário de verão não desloca nada.
 */
export class DataLocal {
  private constructor(private readonly utc: number) {}

  /** O dia local de um instante (ex.: o relógio do sistema). */
  static de(instante: Date): DataLocal {
    if (Number.isNaN(instante.getTime())) throw new DataInvalidaError('Data inválida.');
    return new DataLocal(Date.UTC(instante.getFullYear(), instante.getMonth(), instante.getDate()));
  }

  /** "2026-11-24" (formato do `<input type="date">` e da persistência). */
  static iso(texto: string): DataLocal {
    const m = ISO.exec(texto);
    if (!m) throw new DataInvalidaError(`Data inválida: "${texto}".`);
    const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const utc = Date.UTC(ano, mes - 1, dia);
    const d = new Date(utc);
    if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
      throw new DataInvalidaError(`Data inexistente: "${texto}".`);
    }
    return new DataLocal(utc);
  }

  /** Dias de `this` até `outra` (positivo se `outra` vem depois). */
  diasAte(outra: DataLocal): number {
    return Math.round((outra.utc - this.utc) / DIA_MS);
  }

  somarDias(dias: number): DataLocal {
    return new DataLocal(this.utc + dias * DIA_MS);
  }

  paraIso(): string {
    return new Date(this.utc).toISOString().slice(0, 10);
  }

  /** "24/11/2026". */
  formatar(): string {
    const [ano, mes, dia] = this.paraIso().split('-');
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * Dia do ano num calendário de 365 dias (1º/jan = 1, 31/dez = 365): 29/fev conta como
   * 28/fev, para planos anuais seguirem o calendário também em ano bissexto.
   */
  diaDoAnoComum(): number {
    const d = new Date(this.utc);
    const mes = d.getUTCMonth();
    const dia = Math.min(d.getUTCDate(), mes === 1 ? 28 : 31);
    return Math.round((Date.UTC(2001, mes, dia) - Date.UTC(2001, 0, 1)) / DIA_MS) + 1;
  }

  equals(outra: DataLocal): boolean {
    return this.utc === outra.utc;
  }
}
