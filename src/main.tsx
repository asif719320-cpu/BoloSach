import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

const isNonHtmlMetadataRoute =
  typeof window !== 'undefined' && /\.(xml|txt)\/?$/i.test(window.location.pathname);

if (isNonHtmlMetadataRoute && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void (async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore unregister errors
    }
    const guardKey = `bolosach_sw_bypass_${window.location.pathname}`;
    if (!sessionStorage.getItem(guardKey)) {
      sessionStorage.setItem(guardKey, '1');
      window.location.replace(window.location.href);
    }
  })();
} else {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        void registration.update();
      }
    },
  });

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) {
        reloaded = true;
        window.location.reload();
      }
    });
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
