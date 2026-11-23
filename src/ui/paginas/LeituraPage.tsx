import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Referencia } from '../../dominio/biblia';
import {
  TextoDoCapitulo,
  type CorDestaque,
  type Destaque,
  type DestaqueId,
} from '../../dominio/estudo';
import { AcoesVersiculo } from '../componentes/AcoesVersiculo';
import { BarraDestaque, BarraSelecao } from '../componentes/BarrasMarcaTexto';
import { BarraSuperior } from '../componentes/BarraSuperior';
import { idBotaoVersiculo } from '../componentes/idsVersiculo';
import { NOME_COR } from '../componentes/nomesCores';
import { PaginaPapel } from '../componentes/PaginaPapel';
import { SeletorReferencia } from '../componentes/SeletorReferencia';
import { useDependencias } from '../contexto/Dependencias';
import { useCapitulo } from '../hooks/useCapitulo';
import { useEditarDestaques, type AcaoDestaque } from '../hooks/useDestaques';
import { useAlternarFavorito } from '../hooks/useFavoritos';
import { useMarcacoes } from '../hooks/useMarcacoes';
import { useNavegacaoCapitulos } from '../hooks/useNavegacaoCapitulos';
import { useSelecaoTexto } from '../hooks/useSelecaoTexto';
import { caminhoLeitura, referenciaDaRota } from '../rotas';

/** UC01 — Ler capítulo (rota /ler/:livro/:capitulo/:versiculo?). */
export function LeituraPage() {
  const { canon, versaoPadrao } = useDependencias();
  const { livro, capitulo, versiculo } = useParams();
  const ref = useMemo(
    () => referenciaDaRota({ livro, capitulo, versiculo }, canon),
    [livro, capitulo, versiculo, canon],
  );
  if (!ref) return <ReferenciaInexistente />;
  return <Leitura referencia={ref} nomeVersao={versaoPadrao.nome} sigla={versaoPadrao.sigla} />;
}

function Leitura({
  referencia: ref,
  nomeVersao,
  sigla,
}: {
  referencia: Referencia;
  nomeVersao: string;
  sigla: string;
}) {
  const { canon } = useDependencias();
  const navigate = useNavigate();
  const { aberto, erro, carregando } = useCapitulo(ref);

  // Navegação parte do capítulo exibido (não do pedido), para não "pular" durante o carregamento.
  const exibido = aberto;
  const irPara = (destino: Referencia | null | undefined) =>
    destino ? () => void navigate(caminhoLeitura(destino)) : null;
  const irAnterior = irPara(exibido?.anterior);
  const irProximo = irPara(exibido?.proximo);
  const toque = useNavegacaoCapitulos(irAnterior, irProximo);

  const titulo = ref.doCapitulo().formatar(canon.livro(ref.livro));
  useEffect(() => {
    document.title = `${titulo} · Bíblia App`;
  }, [titulo]);

  // Marcações do capítulo exibido (UC04, UC05).
  const capituloExibido = exibido?.capitulo.referencia ?? null;
  const marcacoes = useMarcacoes(exibido?.capitulo ?? null);
  const alternar = useAlternarFavorito();
  const editar = useEditarDestaques();
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null);

  // Barra aberta pelo número do versículo ou por um destaque tocado. Vale só para o
  // capítulo em que foi aberta (trocar de capítulo fecha a barra).
  const [barra, setBarra] = useState<BarraAberta | null>(null);
  const barraAtual = capituloExibido && barra?.capitulo === capituloExibido.chave() ? barra : null;
  const selecionado = barraAtual?.tipo === 'versiculo' ? barraAtual.versiculo : null;
  const destaqueAtivo =
    barraAtual?.tipo === 'destaque' ? (marcacoes?.destaque(barraAtual.id) ?? null) : null;

  // UC05 — seleção de texto; selecionar fecha as outras barras.
  const refTexto = useRef<HTMLParagraphElement>(null);
  const refBarraSelecao = useRef<HTMLDivElement>(null);
  const { selecao, limpar: limparSelecao } = useSelecaoTexto(
    refTexto,
    refBarraSelecao,
    exibido?.capitulo ?? null,
    () => setBarra(null),
  );

  const favoritado = (versiculo: number) => {
    const base = marcacoes?.favoritado(versiculo) ?? false;
    const pendente = alternar.isPending ? alternar.variables : null;
    // Atualização otimista: inverte enquanto a gravação está em andamento.
    const emAndamento =
      pendente?.versiculo === versiculo &&
      capituloExibido !== null &&
      pendente.doCapitulo().equals(capituloExibido);
    return emAndamento ? !base : base;
  };

  const temMarcacao = (versiculo: number) => {
    const v = exibido?.capitulo.versiculo(versiculo);
    return !!v && (marcacoes?.faixasDestacadas(versiculo, v.texto.length).length ?? 0) > 0;
  };

  const abrirOuFecharAcoes = (versiculo: number) => {
    if (versiculo === selecionado) fecharAcoes();
    else if (capituloExibido) {
      limparSelecao();
      setBarra({ tipo: 'versiculo', capitulo: capituloExibido.chave(), versiculo });
    }
  };

  const fecharAcoes = () => {
    const versiculo = selecionado;
    setBarra(null);
    if (versiculo !== null) {
      document.getElementById(idBotaoVersiculo(versiculo))?.focus();
    }
  };

  const abrirDestaque = (id: DestaqueId) => {
    if (capituloExibido) setBarra({ tipo: 'destaque', capitulo: capituloExibido.chave(), id });
  };

  const nomeVersiculo = (versiculo: number) => {
    const alvo = exibido?.capitulo.versiculo(versiculo)?.referencia;
    return alvo ? alvo.formatar(canon.livro(alvo.livro)) : '';
  };

  const alternarFavorito = (versiculo: number) => {
    const alvo = exibido?.capitulo.versiculo(versiculo)?.referencia;
    if (!alvo || alternar.isPending) return;
    const nome = nomeVersiculo(versiculo);
    fecharAcoes();
    alternar.mutate(alvo, {
      onSuccess: (agora) =>
        setAviso({
          texto: agora ? `${nome} adicionado aos favoritos.` : `${nome} removido dos favoritos.`,
          erro: false,
        }),
      onError: () =>
        setAviso({ texto: `Não foi possível atualizar o favorito de ${nome}.`, erro: true }),
    });
  };

  const editarDestaques = (acao: AcaoDestaque, sucesso: string, falha: string) => {
    if (editar.isPending) return;
    editar.mutate(acao, {
      onSuccess: () => setAviso({ texto: sucesso, erro: false }),
      onError: () => setAviso({ texto: falha, erro: true }),
    });
  };

  const marcar = (cor: CorDestaque) => {
    if (!selecao || !exibido) return;
    limparSelecao();
    editarDestaques(
      { tipo: 'marcar', versao: exibido.capitulo.versaoId, trecho: selecao, cor },
      `Trecho marcado em ${NOME_COR[cor]}.`,
      'Não foi possível marcar o trecho.',
    );
  };

  const desmarcarSelecao = () => {
    if (!selecao || !exibido) return;
    limparSelecao();
    editarDestaques(
      { tipo: 'desmarcar', versao: exibido.capitulo.versaoId, trecho: selecao },
      'Marcação removida do trecho.',
      'Não foi possível remover a marcação.',
    );
  };

  const removerMarcacaoDoVersiculo = (versiculo: number) => {
    if (!exibido) return;
    const trecho = new TextoDoCapitulo(exibido.capitulo).intervaloDoVersiculo(versiculo);
    const nome = nomeVersiculo(versiculo);
    fecharAcoes();
    if (!trecho) return;
    editarDestaques(
      { tipo: 'desmarcar', versao: exibido.capitulo.versaoId, trecho },
      `Marcação removida de ${nome}.`,
      `Não foi possível remover a marcação de ${nome}.`,
    );
  };

  const mudarCor = (destaque: Destaque, cor: CorDestaque) => {
    setBarra(null);
    editarDestaques(
      { tipo: 'cor', destaque, cor },
      `Destaque alterado para ${NOME_COR[cor]}.`,
      'Não foi possível alterar a cor do destaque.',
    );
  };

  const removerDestaque = (destaque: Destaque) => {
    setBarra(null);
    editarDestaques(
      { tipo: 'remover', destaque },
      'Destaque removido.',
      'Não foi possível remover o destaque.',
    );
  };

  const algumaBarra = selecionado !== null || destaqueAtivo !== null || selecao !== null;
  const sobrepoeDestaque =
    selecao !== null && !!marcacoes?.destaques.some((d) => d.intervalo.sobrepoe(selecao));

  return (
    <>
      <BarraSuperior>
        <SeletorReferencia atual={ref} />
        <span
          className="border-papel-borda rounded-md border bg-white px-3 py-1.5 text-sm"
          title={nomeVersao}
        >
          {sigla}
        </span>
      </BarraSuperior>

      <main
        className={`relative mx-auto max-w-5xl px-2 py-6 sm:px-4 sm:py-10 ${algumaBarra ? 'pb-28 sm:pb-28' : ''}`}
        onTouchStart={toque.onTouchStart}
        onTouchEnd={toque.onTouchEnd}
        aria-busy={carregando}
      >
        {erro ? (
          <Mensagem titulo="Não foi possível abrir o capítulo">{erro.message}</Mensagem>
        ) : exibido ? (
          <PaginaPapel
            aberto={exibido}
            nomeVersao={nomeVersao}
            favoritado={favoritado}
            selecionado={selecionado}
            onAcoesVersiculo={abrirOuFecharAcoes}
            faixas={(n, tamanho) => marcacoes?.faixasDestacadas(n, tamanho) ?? []}
            destaqueAtivo={destaqueAtivo?.id ?? null}
            onTocarDestaque={abrirDestaque}
            refTexto={refTexto}
          />
        ) : null}

        {exibido && (
          <nav
            aria-label="Capítulos"
            className="mx-auto mt-6 flex max-w-2xl justify-between gap-2 font-sans text-sm lg:pointer-events-none lg:fixed lg:inset-x-0 lg:top-1/2 lg:mt-0 lg:max-w-5xl lg:-translate-y-1/2 lg:px-4"
          >
            <BotaoCapitulo
              destino={exibido.anterior}
              onClick={irAnterior}
              rotulo="Capítulo anterior"
              simbolo="‹"
            />
            <BotaoCapitulo
              destino={exibido.proximo}
              onClick={irProximo}
              rotulo="Próximo capítulo"
              simbolo="›"
            />
          </nav>
        )}

        {exibido && selecao !== null ? (
          <BarraSelecao
            ref={refBarraSelecao}
            ocupado={editar.isPending}
            onMarcar={marcar}
            onDesmarcar={sobrepoeDestaque ? desmarcarSelecao : undefined}
            onFechar={limparSelecao}
          />
        ) : exibido && selecionado !== null ? (
          <AcoesVersiculo
            rotulo={nomeVersiculo(selecionado)}
            favoritado={favoritado(selecionado)}
            onAlternarFavorito={() => alternarFavorito(selecionado)}
            onRemoverMarcacao={
              temMarcacao(selecionado) ? () => removerMarcacaoDoVersiculo(selecionado) : undefined
            }
            onFechar={() => fecharAcoes()}
          />
        ) : exibido && destaqueAtivo ? (
          <BarraDestaque
            rotulo={rotuloDestaque(destaqueAtivo, exibido.livro.nome)}
            cor={destaqueAtivo.cor}
            ocupado={editar.isPending}
            onCor={(cor) => mudarCor(destaqueAtivo, cor)}
            onRemover={() => removerDestaque(destaqueAtivo)}
            onFechar={() => setBarra(null)}
          />
        ) : null}

        <p role="status" className="sr-only">
          {aviso && !aviso.erro ? aviso.texto : ''}
        </p>
        {aviso?.erro && (
          <p
            role="alert"
            className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-30 mx-auto max-w-md rounded-md border border-red-300 bg-red-50 px-4 py-3 text-center font-sans text-sm text-red-800 shadow-lg"
          >
            {aviso.texto}{' '}
            <button type="button" className="underline" onClick={() => setAviso(null)}>
              Fechar
            </button>
          </p>
        )}
      </main>
    </>
  );
}

type BarraAberta =
  | { tipo: 'versiculo'; capitulo: string; versiculo: number }
  | { tipo: 'destaque'; capitulo: string; id: DestaqueId };

/** "João 3:16" ou "João 3:16–17". */
function rotuloDestaque(d: Destaque, nomeLivro: string): string {
  const { inicio, fim } = d.intervalo;
  const base = `${nomeLivro} ${d.capitulo.capitulo}:${inicio.numero}`;
  return fim.numero === inicio.numero ? base : `${base}–${fim.numero}`;
}

function BotaoCapitulo({
  destino,
  onClick,
  rotulo,
  simbolo,
}: {
  destino: Referencia | null;
  onClick: (() => void) | null;
  rotulo: string;
  simbolo: string;
}) {
  const { canon } = useDependencias();
  const nomeDestino = destino?.formatar(canon.livro(destino.livro));
  return (
    <button
      type="button"
      onClick={onClick ?? undefined}
      disabled={!onClick}
      aria-label={nomeDestino ? `${rotulo}: ${nomeDestino}` : rotulo}
      title={nomeDestino}
      className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-stone-300 bg-white text-2xl leading-none shadow-sm hover:bg-stone-50 disabled:opacity-35"
    >
      <span aria-hidden="true">{simbolo}</span>
    </button>
  );
}

function Mensagem({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="pagina-papel border-papel-borda mx-auto max-w-md rounded-sm border px-8 py-10 text-center shadow-xl">
      <h1 className="font-serif text-2xl">{titulo}</h1>
      <p className="text-tinta-suave mt-4 text-sm">{children}</p>
    </section>
  );
}

function ReferenciaInexistente() {
  return (
    <>
      <BarraSuperior />
      <main className="px-4 py-10">
        <Mensagem titulo="Referência não encontrada">
          Este endereço não corresponde a um capítulo da Bíblia.{' '}
          <Link to="/" className="text-primaria underline">
            Voltar à leitura
          </Link>
        </Mensagem>
      </main>
    </>
  );
}
