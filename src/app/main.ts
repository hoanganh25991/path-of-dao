import { App } from '@/app/App';
import '@/app/app.css';
import '@/ui/styles/global.css';

App.init().catch((error: unknown) => {
  console.error('Failed to initialize app', error);
});
