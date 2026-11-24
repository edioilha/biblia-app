import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import { dependencias } from './container';
import { pedirArmazenamentoPersistente } from './infraestrutura/armazenamento';
import { App } from './ui/App';
import { criarClienteConsultas } from './ui/consultas/clienteConsultas';
import { DependenciasProvider } from './ui/contexto/Dependencias';
import './ui/estilos/index.css';

registerSW({ immediate: true });
// BL-05: os dados do leitor só existem neste aparelho; pede para não serem despejados.
void pedirArmazenamentoPersistente();

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root não encontrado.');

createRoot(raiz).render(
  <StrictMode>
    <DependenciasProvider valor={dependencias}>
      <QueryClientProvider client={criarClienteConsultas()}>
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>
    </DependenciasProvider>
  </StrictMode>,
);
