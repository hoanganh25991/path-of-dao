import { App } from '@/app/App';
import { initErrorReporter } from '@/app/ErrorReporter';
import '@/app/app.css';
import '@/ui/styles/global.css';
import '@/ui/styles/orientation.css';

initErrorReporter();

if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

App.init().catch((error: unknown) => {
  console.error('Failed to initialize app', error);
});
