import { describe, expect, it } from 'vitest';
import { BackupJson } from '../../infraestrutura/backup';
import { anotacao } from '../../test/anotacoes';
import { favorito, inscricao } from '../../test/dadosLeitor';
import { canon, destaque } from '../../test/destaques';
import {
  AnotacoesEmMemoria,
  DadosLeitorEmMemoria,
  DestaquesEmMemoria,
  FavoritosEmMemoria,
  InscricoesEmMemoria,
  RelogioFixo,
} from '../../test/fakes';
import { BackupInvalidoError, ExportarDados, ImportarDados, TAMANHO_MAXIMO_BACKUP } from './backup';

function aparelho() {
  const repos = {
    favoritos: new FavoritosEmMemoria(),
    destaques: new DestaquesEmMemoria(),
    anotacoes: new AnotacoesEmMemoria(),
    inscricoes: new InscricoesEmMemoria(),
  };
  const dados = new DadosLeitorEmMemoria(
    repos.favoritos,
    repos.destaques,
    repos.anotacoes,
    repos.inscricoes,
  );
  const formato = new BackupJson(canon);
  return {
    ...repos,
    exportar: new ExportarDados(dados, formato, new RelogioFixo(new Date(2026, 10, 24, 23, 30))),
    importar: new ImportarDados(dados, formato),
  };
}

describe('ExportarDados / ImportarDados (UC11)', () => {
  it('exporta com nome datado (data local) e totais', async () => {
    const a = aparelho();
    a.favoritos.itens.set(favorito(1, 'Jo 3:16').id, favorito(1, 'Jo 3:16'));
    a.anotacoes.itens.set(anotacao(1, 'Jo 3:16').id, anotacao(1, 'Jo 3:16'));
    const backup = await a.exportar.executar();
    expect(backup.nomeArquivo).toBe('biblia-app-backup-2026-11-24.json');
    expect(backup.totais).toEqual({ favoritos: 1, destaques: 0, anotacoes: 1, inscricoes: 0 });
    expect(JSON.parse(backup.conteudo)).toMatchObject({ app: 'biblia-app', formato: 1 });
  });

  it('leva tudo para outro aparelho, juntando com o que ele já tem', async () => {
    const origem = aparelho();
    origem.favoritos.itens.set(favorito(1, 'Jo 3:16').id, favorito(1, 'Jo 3:16'));
    origem.destaques.itens.set(destaque(1, '1:0-1:3').id, destaque(1, '1:0-1:3'));
    origem.anotacoes.itens.set(anotacao(1, 'Jo 3:16').id, anotacao(1, 'Jo 3:16'));
    origem.inscricoes.itens.set(inscricao(1, [1]).id, inscricao(1, [1]));
    const { conteudo } = await origem.exportar.executar();

    const destino = aparelho();
    destino.favoritos.itens.set(favorito(9, 'Gn 1:1').id, favorito(9, 'Gn 1:1'));
    const previa = await destino.importar.analisar(conteudo);
    expect(previa.totais).toEqual({ favoritos: 1, destaques: 1, anotacoes: 1, inscricoes: 1 });
    expect(previa.resumo.favoritos.novos).toBe(1);
    expect(destino.favoritos.itens.size).toBe(1); // analisar não grava

    await destino.importar.executar(conteudo);
    expect(destino.favoritos.itens.size).toBe(2);
    expect(destino.destaques.itens.size).toBe(1);
    expect(destino.anotacoes.itens.size).toBe(1);
    expect(destino.inscricoes.itens.size).toBe(1);

    // Importar de novo não duplica nada.
    const repetida = await destino.importar.executar(conteudo);
    expect(repetida.favoritos).toEqual({ novos: 0, atualizados: 0, mantidos: 1 });
    expect(destino.favoritos.itens.size).toBe(2);
  });

  it('arquivo inválido não grava nada', async () => {
    const a = aparelho();
    await expect(a.importar.analisar('{}')).rejects.toThrow(BackupInvalidoError);
    await expect(a.importar.executar('{}')).rejects.toThrow(BackupInvalidoError);
  });

  it('recusa arquivo acima do limite sem interpretar (BL-16)', async () => {
    const a = aparelho();
    const enorme = ' '.repeat(TAMANHO_MAXIMO_BACKUP + 1);
    await expect(a.importar.analisar(enorme)).rejects.toThrow(/grande demais/);
    await expect(a.importar.executar(enorme)).rejects.toThrow(BackupInvalidoError);
  });
});
