import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useDependencias } from '../contexto/Dependencias';
import { caminhoLeitura } from '../rotas';

/** UC01 passo 2: "/" abre a última posição de leitura (ou Gênesis 1). */
export function InicioPage() {
  const { obterPosicaoInicial } = useDependencias();
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    void obterPosicaoInicial.executar().then((ref) => setDestino(caminhoLeitura(ref)));
  }, [obterPosicaoInicial]);

  return destino ? <Navigate to={destino} replace /> : null;
}
