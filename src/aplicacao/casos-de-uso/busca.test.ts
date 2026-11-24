import { describe, expect, it } from 'vitest';
import { VersaoId } from '../../dominio/biblia';
import { ConsultaBusca, Pagina, type ResultadoBusca } from '../../dominio/busca';
import type { ServicoBusca } from '../portas';
import { BuscarTexto } from './BuscarTexto';
import { PrepararBusca } from './PrepararBusca';

class ServicoEspiao implements ServicoBusca {
  readonly chamadas: string[] = [];
  async preparar(versao: VersaoId) {
    this.chamadas.push(`preparar ${versao}`);
  }
  async buscar(versao: VersaoId, c: ConsultaBusca): Promise<Pagina<ResultadoBusca>> {
    this.chamadas.push(`buscar ${versao} ${c.termo}`);
    return new Pagina([], c.pagina, c.tamanhoPagina, 7);
  }
  async descartar(versao: VersaoId) {
    this.chamadas.push(`descartar ${versao}`);
  }
}

const BLIVRE = VersaoId.de('BLIVRE');

describe('BuscarTexto (UC03)', () => {
  it('busca na versão ativa', async () => {
    const servico = new ServicoEspiao();
    const pagina = await new BuscarTexto(servico).executar(
      BLIVRE,
      ConsultaBusca.interpretar('luz'),
    );
    expect(pagina.total).toBe(7);
    expect(servico.chamadas).toEqual(['buscar BLIVRE luz']);
  });

  it('abaixo do termo mínimo devolve página vazia sem consultar o índice', async () => {
    const servico = new ServicoEspiao();
    const pagina = await new BuscarTexto(servico).executar(
      BLIVRE,
      ConsultaBusca.interpretar('a', { tamanhoPagina: 10 }),
    );
    expect([pagina.total, pagina.tamanhoPagina]).toEqual([0, 10]);
    expect(servico.chamadas).toEqual([]);
  });
});

describe('PrepararBusca', () => {
  it('prepara o índice da versão ativa', async () => {
    const servico = new ServicoEspiao();
    await new PrepararBusca(servico).executar(BLIVRE);
    expect(servico.chamadas).toEqual(['preparar BLIVRE']);
  });
});
