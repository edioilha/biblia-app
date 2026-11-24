import { beforeEach, describe, expect, it } from 'vitest';
import { Canon, Referencia } from '../../dominio/biblia';
import { DataLocal, PlanoId } from '../../dominio/planos';
import { PlanosPreDefinidos } from '../../infraestrutura/planos';
import { GeradorIdSequencial, InscricoesEmMemoria, RelogioFixo } from '../../test/fakes';
import { EncerrarPlano } from './EncerrarPlano';
import { IniciarPlano } from './IniciarPlano';
import { MarcarDiaPlano } from './MarcarDiaPlano';
import { ObterLeiturasDoCapitulo } from './ObterLeiturasDoCapitulo';
import { ObterPainelPlanos } from './ObterPainelPlanos';
import { PlanoInexistenteError, PlanoJaIniciadoError } from './planosSeguidos';
import { ReagendarPlano } from './ReagendarPlano';

const canon = new Canon();
const cap = (t: string) => Referencia.parse(t, canon);
const NT = PlanoId.de('nt-90-dias');
const SALMOS = PlanoId.de('salmos-proverbios-31-dias');
const data = (iso: string) => DataLocal.iso(iso);

describe('Planos de leitura (UC07/UC08)', () => {
  // O catálogo real (dados determinísticos) evita um fake que repetiria a mesma lógica.
  const catalogo = new PlanosPreDefinidos(canon);
  let inscricoes: InscricoesEmMemoria;
  let relogio: RelogioFixo;
  let iniciar: IniciarPlano;
  let painel: ObterPainelPlanos;

  beforeEach(() => {
    inscricoes = new InscricoesEmMemoria();
    relogio = new RelogioFixo(new Date(2026, 10, 10, 9, 0)); // 10/11/2026, hora local
    iniciar = new IniciarPlano(catalogo, inscricoes, new GeradorIdSequencial());
    painel = new ObterPainelPlanos(catalogo, inscricoes, relogio);
  });

  it('painel: sem planos, todo o catálogo está disponível', async () => {
    const p = await painel.executar();
    expect(p.hoje.paraIso()).toBe('2026-11-10');
    expect(p.seguidos).toEqual([]);
    expect(p.disponiveis.map((x) => x.id)).toEqual([
      'biblia-1-ano',
      'nt-90-dias',
      'salmos-proverbios-31-dias',
    ]);
  });

  it('inicia um plano com a data escolhida; ele sai do catálogo (UC07)', async () => {
    const i = await iniciar.executar(NT, data('2026-11-08'));
    expect(i.totalDias).toBe(90);
    expect(i.inicio.paraIso()).toBe('2026-11-08');

    const p = await painel.executar();
    expect(p.seguidos.map((s) => s.plano.id)).toEqual([NT]);
    expect(p.disponiveis.map((x) => x.id)).not.toContain(NT);
  });

  it('vários planos ao mesmo tempo, mas o mesmo plano só uma vez', async () => {
    await iniciar.executar(NT, data('2026-11-10'));
    await iniciar.executar(SALMOS, data('2026-11-10'));
    await expect(iniciar.executar(NT, data('2026-11-10'))).rejects.toThrow(PlanoJaIniciadoError);
    await expect(iniciar.executar(PlanoId.de('nao-existe'), data('2026-11-10'))).rejects.toThrow(
      PlanoInexistenteError,
    );
    expect(inscricoes.itens.size).toBe(2);
  });

  it('plano concluído pode recomeçar do zero', async () => {
    const i = await iniciar.executar(SALMOS, data('2026-10-01'));
    const marcar = new MarcarDiaPlano(inscricoes);
    for (let d = 1; d <= 31; d++) await marcar.executar(i.id, d, true);
    expect((await inscricoes.porId(i.id))?.status).toBe('CONCLUIDO');

    const nova = await iniciar.executar(SALMOS, data('2026-11-10'));
    expect(nova.diasConcluidos.size).toBe(0);
    expect(inscricoes.itens.size).toBe(1);
  });

  it('conclui e desfaz um dia; reagenda o atraso; encerra', async () => {
    const i = await iniciar.executar(NT, data('2026-11-01')); // hoje = dia 10
    const marcar = new MarcarDiaPlano(inscricoes);
    await marcar.executar(i.id, 1, true);
    await marcar.executar(i.id, 2, true);
    await marcar.executar(i.id, 2, false);
    let atual = await inscricoes.porId(i.id);
    expect([...(atual?.diasConcluidos ?? [])]).toEqual([1]);

    await new ReagendarPlano(inscricoes, relogio).executar(i.id);
    atual = await inscricoes.porId(i.id);
    expect(atual?.diaDe(data('2026-11-10'))).toBe(2);

    await new EncerrarPlano(inscricoes).executar(i.id);
    expect(inscricoes.itens.size).toBe(0);
  });

  describe('leitura do capítulo aberto (faixa do plano)', () => {
    const leituras = () => new ObterLeiturasDoCapitulo(catalogo, inscricoes, relogio);

    it('acha o dia de hoje que inclui o capítulo', async () => {
      await iniciar.executar(SALMOS, data('2026-11-10')); // hoje = dia 1
      const [l] = await leituras().executar(cap('Sl 31'));
      expect(l?.dia.numero).toBe(1);
      expect(l?.plano.id).toBe(SALMOS);
      expect(await leituras().executar(cap('Sl 2'))).toEqual([]);
    });

    it('se não é de hoje, usa o dia atrasado mais antigo com o capítulo', async () => {
      await iniciar.executar(SALMOS, data('2026-11-08')); // hoje = dia 3; dias 1 e 2 atrasados
      const [l] = await leituras().executar(cap('Pv 2'));
      expect(l?.dia.numero).toBe(2);
      // Dia futuro não aparece.
      expect(await leituras().executar(cap('Pv 5'))).toEqual([]);
    });

    it('ignora plano que ainda não começou ou já foi concluído', async () => {
      await iniciar.executar(SALMOS, data('2026-11-20'));
      expect(await leituras().executar(cap('Sl 1'))).toEqual([]);
    });
  });
});
