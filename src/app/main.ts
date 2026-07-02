import { createBootState } from '@/app/bootstrap';

export function mountApp(root: HTMLElement): void {
  const boot = createBootState();

  root.innerHTML = `
    <main class="boot-screen" role="main">
      <h1 class="boot-screen__title">${boot.title}</h1>
      <p class="boot-screen__subtitle">Void Ascension · 修仙之路</p>
      <p class="boot-screen__version">v${boot.version}</p>
      <p class="boot-screen__status">${boot.ready ? 'Foundation ready' : 'Loading…'}</p>
    </main>
  `;
}

const root = document.getElementById('app');
if (root) {
  mountApp(root);
}
