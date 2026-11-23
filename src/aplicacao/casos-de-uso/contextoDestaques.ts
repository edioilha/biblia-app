import type { Referencia, VersaoId } from '../../dominio/biblia';
import { DestaqueId, SobreposicaoDestaques, TextoDoCapitulo } from '../../dominio/estudo';
import type { DestaqueRepository, GeradorId, TextoBiblicoRepository } from '../portas';
import { CapituloIndisponivelError } from './AbrirCapitulo';

/**
 * Carrega o que os casos de uso de destaques (UC05) precisam para aplicar as regras num
 * capítulo: o texto, a regra de sobreposição e os destaques existentes.
 */
export async function contextoDestaques(
  deps: {
    texto: TextoBiblicoRepository;
    destaques: DestaqueRepository;
    gerador: GeradorId;
  },
  versao: VersaoId,
  capitulo: Referencia,
) {
  const cap = await deps.texto.obterCapitulo(versao, capitulo.doCapitulo());
  if (!cap) throw new CapituloIndisponivelError(versao, capitulo);
  const texto = new TextoDoCapitulo(cap);
  return {
    texto,
    regras: new SobreposicaoDestaques(texto, () => DestaqueId.de(deps.gerador.novo())),
    existentes: await deps.destaques.porCapitulo(versao, capitulo),
  };
}
