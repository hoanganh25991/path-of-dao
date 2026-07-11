/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';

// Real 'phaser' pulls in canvas/webgl bootstrapping that jsdom can't satisfy;
// JuiceController only touches Phaser.BlendModes.ADD at runtime (rest is types).
vi.mock('phaser', () => ({ default: { BlendModes: { ADD: 1 } } }));

const { JuiceController } = await import('@/combat/juice/JuiceController');

type TweenConfig = {
  targets: unknown;
  fillAlpha?: number;
  alpha?: number;
  duration: number;
  yoyo?: boolean;
  hold?: number;
  onComplete?: () => void;
};

/** Minimal Phaser.Scene double — just enough surface for JuiceController. */
function createMockScene() {
  const rectangles: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    color: number;
    alpha: number;
    destroy: () => void;
    setScrollFactor: () => unknown;
    setDepth: () => unknown;
    setBlendMode: () => unknown;
    setPosition: () => unknown;
    setSize: () => unknown;
    setAlpha: (a: number) => unknown;
  }> = [];
  const tweenCalls: TweenConfig[] = [];

  const scene = {
    time: {
      timeScale: 1,
      delayedCall: vi.fn((_ms: number, cb: () => void) => cb()),
    },
    cameras: {
      main: { shake: vi.fn() },
    },
    scale: { width: 800, height: 600 },
    add: {
      rectangle: vi.fn((x: number, y: number, width: number, height: number, color: number, alpha: number) => {
        const rect = {
          x,
          y,
          width,
          height,
          color,
          alpha,
          destroy: vi.fn(),
          setScrollFactor: vi.fn(() => rect),
          setDepth: vi.fn(() => rect),
          setBlendMode: vi.fn(() => rect),
          setPosition: vi.fn(() => rect),
          setSize: vi.fn(() => rect),
          setAlpha: vi.fn((a: number) => {
            rect.alpha = a;
            return rect;
          }),
        };
        rectangles.push(rect);
        return rect;
      }),
    },
    tweens: {
      add: vi.fn((config: TweenConfig) => {
        tweenCalls.push(config);
        return config;
      }),
    },
  };

  return { scene, rectangles, tweenCalls };
}

describe('JuiceController — boss phase screen darken', () => {
  it('applyBossPhaseJuice darkens the screen with a short veil rectangle (~500ms)', () => {
    const { scene, rectangles, tweenCalls } = createMockScene();
    const juice = new JuiceController(scene as never);

    juice.applyBossPhaseJuice();

    expect(scene.cameras.main.shake).toHaveBeenCalledWith(500, 0.012);
    expect(rectangles).toHaveLength(1);
    expect(rectangles[0]!.color).toBe(0x000000);

    const veilTween = tweenCalls.find((t) => t.fillAlpha === 0.35);
    expect(veilTween).toBeDefined();
    expect(veilTween!.duration).toBe(125); // 500 * 0.25
    expect(veilTween!.hold).toBe(250); // 500 * 0.5
    expect(veilTween!.yoyo).toBe(true);
    // up (125) + hold (250) + down (125) = 500ms total — within the ~300-500ms budget.
    expect(veilTween!.duration * 2 + veilTween!.hold!).toBe(500);
  });

  it('destroys the veil rectangle once the darken tween completes (no lingering overlay)', () => {
    const { scene, rectangles, tweenCalls } = createMockScene();
    const juice = new JuiceController(scene as never);

    juice.applyBossPhaseJuice();

    const veilTween = tweenCalls.find((t) => t.fillAlpha === 0.35)!;
    veilTween.onComplete?.();

    expect(rectangles[0]!.destroy).toHaveBeenCalledTimes(1);
  });

  it('does not add a screen darken veil when a low-tier QualityProfile disables juice', () => {
    const { scene, rectangles } = createMockScene();
    const juice = new JuiceController(scene as never);
    juice.setEnabled(false); // QualityProfile low tier: juiceEnabled = false

    juice.applyBossPhaseJuice();

    expect(scene.cameras.main.shake).not.toHaveBeenCalled();
    expect(rectangles).toHaveLength(0);
  });

  it('does not block input — never calls setInteractive on the veil (mock lacks it, so this would throw otherwise)', () => {
    const { scene, rectangles } = createMockScene();
    const juice = new JuiceController(scene as never);

    expect(() => juice.applyBossPhaseJuice()).not.toThrow();
    expect(rectangles[0]).not.toHaveProperty('setInteractive');
  });
});
