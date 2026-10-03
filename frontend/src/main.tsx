import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Standalone entry point. Federation does not go through this file — the shell
// loads `remoteEntry.js`, which pulls in `SpendExplorer.tsx` and nothing else.
import '@insights-platform/ui-kit/styles.css';
import './global.css';

import { App } from './App';
import { reportReactInstance } from './platform/reactIdentity';

reportReactInstance('finance-spend-explorer (standalone)');

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
