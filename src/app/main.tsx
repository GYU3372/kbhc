import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { env } from '@/shared/config/env';
import { Providers } from './providers';
import { AppRouterProvider } from './providers/router-provider';
import './styles/app.css';

async function enableMocks() {
  if (!env.ENABLE_MSW) return;
  const { worker } = await import('@/shared/api/mocks');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

void enableMocks().then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element #root not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <Providers>
        <AppRouterProvider />
      </Providers>
    </StrictMode>,
  );
});
