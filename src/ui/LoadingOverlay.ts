const MIN_VISIBLE_MS = 200;
const FADE_MS = 150;

export class LoadingOverlay {
  private shownAt = 0;
  private visible = false;

  constructor(private readonly element: HTMLElement) {}

  static from(element: HTMLElement): LoadingOverlay {
    return new LoadingOverlay(element);
  }

  async show(): Promise<void> {
    this.element.hidden = false;
    this.element.setAttribute('aria-hidden', 'false');
    this.element.classList.add('loading-overlay--visible');
    this.shownAt = performance.now();
    this.visible = true;
    await wait(FADE_MS);
  }

  async hide(): Promise<void> {
    if (!this.visible) return;

    const elapsed = performance.now() - this.shownAt;
    if (elapsed < MIN_VISIBLE_MS) {
      await wait(MIN_VISIBLE_MS - elapsed);
    }

    this.element.classList.remove('loading-overlay--visible');
    await wait(FADE_MS);
    this.element.hidden = true;
    this.element.setAttribute('aria-hidden', 'true');
    this.visible = false;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
