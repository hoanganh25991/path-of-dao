import { I18nManager } from '@/core/i18n/I18nManager';
import { getTimelineShard } from '@/progression/TimelineLoader';
import { intentRimColor } from '@/shared/intentColors';
import '@/ui/story/story.css';
import '@/ui/story/timeline.css';

const CHARS_PER_SEC = 35;

export interface TimelineShardReaderOptions {
  shardId: string;
  onFinished(): void;
  onSkip?(): void;
}

export interface TimelineShardReaderHandles {
  destroy(): void;
}

/**
 * Dao Scroll read-through — fork of StoryReader. After the diary + Wang Lin
 * parallel slides, shows a punch-line card (Intent-colored rim + attribution).
 * Replay-safe: never grants rewards, never touches save progress.
 */
export function openTimelineShardReader(
  uiRoot: HTMLElement,
  options: TimelineShardReaderOptions,
): TimelineShardReaderHandles {
  const shard = getTimelineShard(options.shardId);
  let slideIndex = 0;
  let phase: 'slides' | 'punchline' = 'slides';
  let typingTimer: ReturnType<typeof setInterval> | null = null;
  let destroyed = false;

  const root = document.createElement('div');
  root.className = 'story-reader story-reader--timeline home-ui__interactive';
  root.dataset.testid = 'timeline-shard-reader';
  root.style.setProperty('--intent-rim', intentRimColor(shard.intentLesson));

  const art = document.createElement('div');
  art.className = 'story-reader__art';

  const artPlaceholder = document.createElement('div');
  artPlaceholder.className = 'story-reader__art-placeholder';
  art.append(artPlaceholder);

  const body = document.createElement('div');
  body.className = 'story-reader__body';

  const textEl = document.createElement('p');
  textEl.className = 'story-reader__text';

  const punchline = document.createElement('div');
  punchline.className = 'story-reader__punchline';
  punchline.hidden = true;

  const punchlineQuote = document.createElement('p');
  punchlineQuote.className = 'story-reader__punchline-quote';

  const punchlineAttribution = document.createElement('p');
  punchlineAttribution.className = 'story-reader__punchline-attribution';

  punchline.append(punchlineQuote, punchlineAttribution);

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
  continueBtn.dataset.testid = 'timeline-shard-reader-continue';
  continueBtn.textContent = I18nManager.t('story.continue');
  continueBtn.hidden = true;

  controls.append(progress, skipBtn, continueBtn);
  body.append(textEl, punchline, controls);
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
    skipBtn.hidden = true;
  };

  const showPunchline = (): void => {
    phase = 'punchline';
    stopTyping();
    textEl.hidden = true;
    punchline.hidden = false;
    art.hidden = true;
    punchlineQuote.textContent = I18nManager.t(shard.punchlineKey);
    punchlineAttribution.textContent = I18nManager.t(shard.punchlineAttributionKey);
    progress.textContent = '';
    skipBtn.hidden = true;
    continueBtn.hidden = false;
    continueBtn.textContent = I18nManager.t('story.continue');
  };

  const typeCurrentSlide = (): void => {
    stopTyping();
    const slide = shard.slides[slideIndex]!;
    fullText = I18nManager.t(slide.textKey);
    charIndex = 0;
    textEl.textContent = '';
    continueBtn.hidden = true;
    progress.textContent = `${slideIndex + 1} / ${shard.slides.length}`;
    skipBtn.hidden = slideIndex < 1;

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
    if (phase === 'punchline') {
      finish();
      return;
    }
    if (slideIndex + 1 >= shard.slides.length) {
      showPunchline();
      return;
    }
    slideIndex += 1;
    typeCurrentSlide();
  };

  const completeLine = (): void => {
    if (phase === 'punchline') {
      finish();
      return;
    }
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
    completeLine();
  });

  continueBtn.addEventListener('click', () => {
    advanceSlide();
  });

  skipBtn.addEventListener('click', () => {
    options.onSkip?.();
    showPunchline();
  });

  typeCurrentSlide();

  return { destroy };
}
