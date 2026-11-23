export {
  ConsultaBusca,
  ConsultaBuscaInvalidaError,
  FiltroBusca,
  ModoBusca,
  Ordenacao,
  TAMANHO_PAGINA_PADRAO,
  TAMANHOS_PAGINA,
  TERMO_MINIMO,
  type OpcoesConsulta,
} from './ConsultaBusca';
export { normalizarTermo, palavras, tokenizar, type Token } from './normalizacao';
export { ocorrenciasDaFrase, ocorrenciasDosTermos, type Ocorrencia } from './ocorrencias';
export { Pagina, type ResultadoBusca } from './ResultadoBusca';
