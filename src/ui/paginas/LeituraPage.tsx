import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Referencia } from '../../dominio/biblia';
import { BarraSuperior } from '../componentes/BarraSuperior';
import { PaginaPapel } from '../componentes/PaginaPapel';
import { SeletorReferencia } from '../componentes/SeletorReferencia';
import { useDependencias } from '../contexto/Dependencias';
import { useCapitulo } from '../hooks/useCapitulo';
import { useNavegacaoCapitulos } from '../hooks/useNavegacaoCapitulos';
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
        className="relative mx-auto max-w-5xl px-2 py-6 sm:px-4 sm:py-10"
        onTouchStart={toque.onTouchStart}
        onTouchEnd={toque.onTouchEnd}
        aria-busy={carregando}
      >
        {erro ? (
          <Mensagem titulo="Não foi possível abrir o capítulo">{erro.message}</Mensagem>
        ) : exibido ? (
          <PaginaPapel aberto={exibido} nomeVersao={nomeVersao} />
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
      </main>
    </>
  );
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
