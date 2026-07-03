import { I18nManager } from '@/core/i18n/I18nManager';
import { getStoryScene } from '@/progression/StoryLoader';
import '@/ui/story/story.css';

const CHARS_PER_SEC = 35;

export interface StoryReaderOptions {
  sceneId: string;
  onFinished(): void;
  onSkip?(): void;
}

export interface StoryReaderHandles {
  destroy(): void;
}

export function openStoryReader(
  uiRoot: HTMLElement,
  options: StoryReaderOptions,
): StoryReaderHandles {
  const scene = getStoryScene(options.sceneId);
  let slideIndex = 0;
  let typingTimer: ReturnType<typeof setInterval> | null = null;
  let destroyed = false;

  const root = document.createElement('div');
  root.className = 'story-reader home-ui__interactive';
  root.dataset.testid = 'story-reader';

  const art = document.createElement('div');
  art.className = 'story-reader__art';

  const artPlaceholder = document.createElement('div');
  artPlaceholder.className = 'story-reader__art-placeholder';
  art.append(artPlaceholder);

  const body = document.createElement('div');
  body.className = 'story-reader__body';

  const textEl = document.createElement('p');
  textEl.className = 'story-reader__text';

  const controls = document.createElement('div');
  controls.className = 'story-reader__controls';

  const progress = document.createElement('span');
  progress.className = 'story-reader__progress';

  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'story-reader__skip';
  skipBtn.textContent = I18nManager.t('story.skip');
  skipBtn.hidden = true;

  const continueBtn = document.createElement('button');
  continueBtn.type = 'button';
  continueBtn.className = 'story-reader__continue';
  continueBtn.textContent = I18nManager.t('story.continue');
  continueBtn.hidden = true;

  controls.append(progress, skipBtn, continueBtn);
  body.append(textEl, controls);
  root.append(art, body);
  uiRoot.append(root);

  const stopTyping = (): void => {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
  };

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    stopTyping();
    root.remove();
  };

  const finish = (): void => {
    destroy();
    options.onFinished();
  };

  let fullText = '';
  let charIndex = 0;

  const showContinue = (): void => {
    continueBtn.hidden = false;
    skipBtn.hidden = slideIndex >= scene.slides.length - 1;
  };

  const typeCurrentSlide = (): void => {
    stopTyping();
    const slide = scene.slides[slideIndex]!;
    fullText = I18nManager.t(slide.textKey);
    charIndex = 0;
    textEl.textContent = '';
    continueBtn.hidden = true;
    progress.textContent = `${slideIndex + 1} / ${scene.slides.length}`;
    skipBtn.hidden = slideIndex < 2;

    if (slide.illustration) {
      art.replaceChildren();
      const img = document.createElement('img');
      img.className = 'story-reader__img';
      img.src = slide.illustration;
      img.alt = '';
      art.append(img);
    }

    typingTimer = setInterval(() => {
      charIndex += 1;
      textEl.textContent = fullText.slice(0, charIndex);
      if (charIndex >= fullText.length) {
        stopTyping();
        showContinue();
      }
    }, 1000 / CHARS_PER_SEC);
  };

  const advanceSlide = (): void => {
    if (slideIndex + 1 >= scene.slides.length) {
      finish();
      return;
    }
    slideIndex += 1;
    typeCurrentSlide();
  };

  const completeLine = (): void => {
    if (charIndex < fullText.length) {
      stopTyping();
      textEl.textContent = fullText;
      showContinue();
      return;
    }
    advanceSlide();
  };

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x < rect.width * 0.35 && slideIndex > 0) {
      slideIndex -= 1;
      typeCurrentSlide();
      return;
    }
    completeLine();
  });

  continueBtn.addEventListener('click', () => {
    advanceSlide();
  });

  skipBtn.addEventListener('click', () => {
    if (slideIndex < 2) return;
    const confirmed = window.confirm(I18nManager.t('story.skip_confirm'));
    if (!confirmed) return;
    options.onSkip?.();
    finish();
  });

  typeCurrentSlide();

  return { destroy };
}
