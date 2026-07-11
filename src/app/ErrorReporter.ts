const RING_MAX = 20;
const ring: string[] = [];

/** Lightweight client error ring buffer for QA export (sub-plan 26). */
export function initErrorReporter(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    pushError(`error: ${event.message} @ ${event.filename}:${event.lineno}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
    pushError(`unhandledrejection: ${reason}`);
  });

  // Live reference so QA / Playwright smoke can read `window.__podErrors.length` directly.
  (window as unknown as Record<string, unknown>).__podErrors = ring;
}

function pushError(line: string): void {
  console.error('[PathOfDao]', line);
  ring.push(`${new Date().toISOString()} ${line}`);
  if (ring.length > RING_MAX) ring.shift();
}

/** @internal Exposed for QA / dev console. */
export function getRecentErrors(): readonly string[] {
  return ring;
}
