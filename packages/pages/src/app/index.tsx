import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './ui/App';

const rootElement = document.getElementById('root');

rootElement &&
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
