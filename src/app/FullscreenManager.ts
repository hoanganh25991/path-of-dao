/** Fullscreen API — request on play taps; boot gesture via AudioUnlock. */

const STORAGE_KEY = 'pod.fullscreen.dismissedAt';
const OPT_OUT_TTL_MS = 24 * 60 * 60 * 1000;

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenCapableDocument = Document & {
  webkitFullscreenElement?: Element | null;
};

export class FullscreenManager {
  private static mounted = false;
  private static target: HTMLElement | null = null;

  static mount(root: HTMLElement): void {
    if (FullscreenManager.mounted) return;
    FullscreenManager.mounted = true;
    FullscreenManager.target = root;

    document.addEventListener('fullscreenchange', FullscreenManager.onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', FullscreenManager.onFullscreenChange);
  }

  static destroy(): void {
    document.removeEventListener('fullscreenchange', FullscreenManager.onFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', FullscreenManager.onFullscreenChange);
    FullscreenManager.target = null;
    FullscreenManager.mounted = false;
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    FullscreenManager.destroy();
    localStorage.removeItem(STORAGE_KEY);
  }

  /** First boot tap (audio-unlock overlay or persisted-unlock pointerdown). */
  static requestOnBootGesture(): void {
    void FullscreenManager.request();
  }

  /** Journey, world-map Enter, ancient echo confirm — must run on the user gesture. */
  static requestOnPlay(): void {
    void FullscreenManager.request();
  }

  static isSupported(): boolean {
    if (FullscreenManager.isStandalonePwa()) return false;
    const el = FullscreenManager.target;
    if (!el) return false;
    return Boolean(el.requestFullscreen ?? (el as FullscreenCapableElement).webkitRequestFullscreen);
  }

  static isActive(): boolean {
    const doc = document as FullscreenCapableDocument;
    return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
  }

  static isOptedOut(): boolean {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < OPT_OUT_TTL_MS;
  }

  private static isStandalonePwa(): boolean {
    try {
      if (typeof window.matchMedia === 'function') {
        if (window.matchMedia('(display-mode: standalone)').matches) return true;
      }
    } catch {
      // matchMedia unavailable in some test environments
    }
    return (navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  private static async request(): Promise<void> {
    if (!FullscreenManager.isSupported()) return;
    if (FullscreenManager.isActive()) return;
    if (FullscreenManager.isOptedOut()) return;

    const el = FullscreenManager.target;
    if (!el) return;

    const req =
      el.requestFullscreen?.bind(el)
      ?? (el as FullscreenCapableElement).webkitRequestFullscreen?.bind(el);
    if (!req) return;

    try {
      await req();
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Blocked or denied — browsers require a user gesture; no retry here.
    }
  }

  private static onFullscreenChange(): void {
    if (FullscreenManager.isActive()) return;
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }
}
