import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import { AppProviders } from '@/app/providers';
import { initTheme } from '@/app/providers/theme-context';
import '@/styles/globals.css';

// Apply the stored theme before first paint to avoid a flash.
initTheme();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
