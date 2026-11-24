import type { ServicoBusca } from '../aplicacao/portas';
import { Canon, type VersaoId } from '../dominio/biblia';
import type { ConsultaBusca, Pagina, ResultadoBusca } from '../dominio/busca';
import { MotorBusca, type CapituloParaIndice } from '../infraestrutura/busca';

interface LivroJson {
  livro: string;
  capitulos: [number, string][][];
}

// Alguns livros reais da Bíblia Livre (public/dados), só nos testes.
const LIVROS = import.meta.glob<LivroJson>('/public/dados/BLIVRE/{GEN,PSA,JHN,ROM,1JN}.json', {
  eager: true,
  import: 'default',
});

/** Capítulos reais da Bíblia Livre, para testes de busca conferíveis. */
export function capitulosBLIVRE(
  livros: readonly string[] = ['GEN', 'PSA', 'JHN', 'ROM', '1JN'],
): CapituloParaIndice[] {
  return livros.flatMap((codigo) => {
    const json = LIVROS[`/public/dados/BLIVRE/${codigo}.json`];
    if (!json) throw new Error(`Livro ${codigo} não carregado para testes.`);
    return json.capitulos.map((versiculos, i) => ({ livro: codigo, numero: i + 1, versiculos }));
  });
}

// Índice do corpus padrão montado uma vez por arquivo de teste (é o passo caro).
let motorPadrao: MotorBusca | null = null;
function construirPadrao(canon: Canon): MotorBusca {
  motorPadrao ??= MotorBusca.construir(canon, capitulosBLIVRE());
  return motorPadrao;
}

/**
 * `ServicoBusca` em memória com o motor real (sem Web Worker). `liberar` permite segurar o
 * preparo para testar o estado "Preparando a busca…".
 */
export class BuscaEmMemoria implements ServicoBusca {
  readonly consultas: ConsultaBusca[] = [];
  preparos = 0;
  private motor: Promise<MotorBusca> | null = null;
  private soltar: (() => void) | null = null;
  private readonly bloqueio: Promise<void>;

  constructor(
    private readonly capitulos: (() => Iterable<CapituloParaIndice>) | undefined = undefined,
    { segurar = false } = {},
    private readonly canon = new Canon(),
  ) {
    this.bloqueio = segurar
      ? new Promise((r) => {
          this.soltar = r;
        })
      : Promise.resolve();
  }

  liberar(): void {
    this.soltar?.();
  }

  /** Versões preparadas, buscadas e descartadas, na ordem (o índice é o mesmo para todas). */
  readonly preparadas: VersaoId[] = [];
  readonly buscadas: VersaoId[] = [];
  readonly descartadas: VersaoId[] = [];

  async preparar(versao: VersaoId): Promise<void> {
    this.preparadas.push(versao);
    await this.indice();
  }

  async buscar(versao: VersaoId, consulta: ConsultaBusca): Promise<Pagina<ResultadoBusca>> {
    const motor = await this.indice();
    this.buscadas.push(versao);
    this.consultas.push(consulta);
    return motor.buscar(consulta);
  }

  async descartar(versao: VersaoId): Promise<void> {
    this.descartadas.push(versao);
  }

  private indice(): Promise<MotorBusca> {
    this.preparos++;
    this.motor ??= this.bloqueio.then(() =>
      this.capitulos
        ? MotorBusca.construir(this.canon, this.capitulos())
        : construirPadrao(this.canon),
    );
    return this.motor;
  }
}
