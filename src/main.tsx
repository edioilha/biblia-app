import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import { dependencias } from './container';
import { App } from './ui/App';
import { DependenciasProvider } from './ui/contexto/Dependencias';
import './ui/estilos/index.css';

registerSW({ immediate: true });

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root não encontrado.');

createRoot(raiz).render(
  <StrictMode>
    <DependenciasProvider valor={dependencias}>
      <HashRouter>
        <App />
      </HashRouter>
    </DependenciasProvider>
  </StrictMode>,
);
