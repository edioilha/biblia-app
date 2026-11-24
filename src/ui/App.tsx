import { Navigate, Route, Routes } from 'react-router';
import { PreparacaoVersao } from './componentes/PreparacaoVersao';
import { InstalacoesProvider } from './contexto/Instalacoes';
import { BuscaPage } from './paginas/BuscaPage';
import { EstudosPage } from './paginas/EstudosPage';
import { InicioPage } from './paginas/InicioPage';
import { LeituraPage } from './paginas/LeituraPage';
import { PlanosPage } from './paginas/PlanosPage';
import { VersoesPage } from './paginas/VersoesPage';

/** Rotas do app (ADR 0009). O roteador (HashRouter) é fornecido por main.tsx. */
export function App() {
  return (
    <PreparacaoVersao>
      <InstalacoesProvider>
        <Routes>
          <Route index element={<InicioPage />} />
          <Route path="ler/:livro/:capitulo/:versiculo?" element={<LeituraPage />} />
          <Route path="buscar" element={<BuscaPage />} />
          <Route path="planos" element={<PlanosPage />} />
          <Route path="estudos" element={<EstudosPage />} />
          <Route path="versoes" element={<VersoesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InstalacoesProvider>
    </PreparacaoVersao>
  );
}
