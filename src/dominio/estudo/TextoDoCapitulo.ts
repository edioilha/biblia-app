import type { Capitulo, Versiculo } from '../biblia';
import { IntervaloTexto, IntervaloTextoInvalidoError, PosicaoTexto } from './IntervaloTexto';

/** Letras, números, marcas combinantes, apóstrofo e hífen ("disse-lhe") formam palavras. */
const PALAVRA = /[\p{L}\p{N}\p{M}'’-]/u;
const ESPACO = /\s/u;

const ehPalavra = (c: string | undefined) => c !== undefined && PALAVRA.test(c);
const ehEspaco = (c: string | undefined) => c !== undefined && ESPACO.test(c);

/**
 * Domain service: regras que dependem do texto de um capítulo para posicionar destaques
 * (UC05). Os versículos são separados por um espaço na página, então a passagem de um
 * versículo ao seguinte conta como espaço.
 */
export class TextoDoCapitulo {
  private readonly versiculos: readonly Versiculo[];
  private readonly indices: ReadonlyMap<number, number>;

  constructor(private readonly capitulo: Capitulo) {
    this.versiculos = capitulo.versiculos;
    this.indices = new Map(this.versiculos.map((v, i) => [v.numero, i]));
  }

  /** Lança se o intervalo não pertence ao capítulo ou se sai do texto dos versículos. */
  validar(intervalo: IntervaloTexto): void {
    if (!intervalo.capitulo.equals(this.capitulo.referencia)) {
      throw new IntervaloTextoInvalidoError(
        `O intervalo é de ${intervalo.capitulo.chave()}, não de ${this.capitulo.referencia.chave()}.`,
      );
    }
    for (const p of [intervalo.inicio, intervalo.fim]) {
      const v = this.versiculo(p.numero);
      if (!v) {
        throw new IntervaloTextoInvalidoError(`Versículo inexistente: ${p.versiculo.chave()}.`);
      }
      if (p.offset > v.texto.length) {
        throw new IntervaloTextoInvalidoError(
          `Offset ${p.offset} além do texto de ${p.versiculo.chave()} (${v.texto.length}).`,
        );
      }
    }
  }

  /** O versículo inteiro, ou `null` se não existe ou não tem texto. */
  intervaloDoVersiculo(numero: number): IntervaloTexto | null {
    const v = this.versiculo(numero);
    if (!v || v.texto.length === 0) return null;
    return IntervaloTexto.criar(
      PosicaoTexto.em(v.referencia, 0),
      PosicaoTexto.em(v.referencia, v.texto.length),
    );
  }

  /**
   * Ajuste da seleção do leitor (decisão da fase 7.3): descarta espaços nas pontas e
   * estende cada ponta que cai no meio de uma palavra até o limite dela. `null` se a
   * seleção não tem texto.
   */
  ajustarAPalavras(intervalo: IntervaloTexto): IntervaloTexto | null {
    const aparado = this.aparar(intervalo);
    if (!aparado) return null;

    const { inicio, fim } = aparado;
    const textoInicio = this.texto(inicio.numero);
    let de = inicio.offset;
    if (ehPalavra(textoInicio[de])) while (de > 0 && ehPalavra(textoInicio[de - 1])) de--;

    const textoFim = this.texto(fim.numero);
    let ate = fim.offset;
    if (ehPalavra(textoFim[ate - 1])) {
      while (ate < textoFim.length && ehPalavra(textoFim[ate])) ate++;
    }

    return IntervaloTexto.criar(
      PosicaoTexto.em(inicio.versiculo, de),
      PosicaoTexto.em(fim.versiculo, ate),
    );
  }

  /** Remove espaços (e passagens entre versículos) das pontas. `null` se nada sobra. */
  aparar(intervalo: IntervaloTexto): IntervaloTexto | null {
    this.validar(intervalo);

    let i = this.indice(intervalo.inicio.numero);
    let de = intervalo.inicio.offset;
    for (;;) {
      const texto = this.texto(this.numero(i));
      if (de >= texto.length && i + 1 < this.versiculos.length) {
        i++;
        de = 0;
      } else if (ehEspaco(texto[de])) {
        de++;
      } else break;
    }

    let f = this.indice(intervalo.fim.numero);
    let ate = intervalo.fim.offset;
    for (;;) {
      if (ate === 0 && f > 0) {
        f--;
        ate = this.texto(this.numero(f)).length;
      } else if (ehEspaco(this.texto(this.numero(f))[ate - 1])) {
        ate--;
      } else break;
    }

    if (i > f || (i === f && de >= ate)) return null;
    return IntervaloTexto.criar(
      PosicaoTexto.em(this.referencia(i), de),
      PosicaoTexto.em(this.referencia(f), ate),
    );
  }

  /** Texto do intervalo, com espaços simples (ex.: trecho em Meus Estudos). */
  trecho(intervalo: IntervaloTexto): string {
    return this.textoEntre(intervalo.inicio, intervalo.fim).replace(/\s+/gu, ' ');
  }

  /** `true` se entre `antes` e `depois` (nessa ordem) só há espaço. */
  soEspacoEntre(antes: PosicaoTexto, depois: PosicaoTexto): boolean {
    if (antes.compararCom(depois) > 0) return false;
    return !/\S/u.test(this.textoEntre(antes, depois));
  }

  private textoEntre(de: PosicaoTexto, ate: PosicaoTexto): string {
    const partes: string[] = [];
    for (let i = this.indice(de.numero); i <= this.indice(ate.numero); i++) {
      const v = this.versiculos[i];
      if (!v) break;
      const inicio = v.numero === de.numero ? de.offset : 0;
      const fim = v.numero === ate.numero ? ate.offset : v.texto.length;
      partes.push(v.texto.slice(inicio, fim));
    }
    return partes.join(' ');
  }

  private versiculo(numero: number): Versiculo | undefined {
    const i = this.indices.get(numero);
    return i === undefined ? undefined : this.versiculos[i];
  }

  private indice(numero: number): number {
    const i = this.indices.get(numero);
    if (i === undefined) throw new IntervaloTextoInvalidoError(`Versículo inexistente: ${numero}.`);
    return i;
  }

  private numero(indice: number): number {
    return this.versiculos[indice]?.numero ?? 0;
  }

  private texto(numero: number): string {
    return this.versiculo(numero)?.texto ?? '';
  }

  private referencia(indice: number) {
    const v = this.versiculos[indice];
    if (!v) throw new IntervaloTextoInvalidoError(`Índice de versículo inválido: ${indice}.`);
    return v.referencia;
  }
}
