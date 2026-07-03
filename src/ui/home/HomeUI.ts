import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { createBottomNav } from '@/ui/home/BottomNav';
import { createProfileHeader } from '@/ui/home/ProfileHeader';
import { createInventoryPanel } from '@/ui/home/panels/InventoryPanel';
import { createPlayPanel } from '@/ui/home/panels/PlayPanel';
import { createSkillsPanel } from '@/ui/home/panels/SkillsPanel';
import { createStoryPanel } from '@/ui/home/panels/StoryPanel';
import type { HomeTab } from '@/ui/home/types';
import '@/ui/home/home.css';

export type { HomeTab } from '@/ui/home/types';

interface PanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

/** HTML overlay for the 3D Home shrine — bottom nav, profile, slide-up panels. */
export class HomeUI {
  private static mounted = false;
  private static root: HTMLElement | null = null;
  private static panelSheet: HTMLElement | null = null;
  private static panelInner: HTMLElement | null = null;
  private static activeTab: HomeTab | null = 'play';
  private static panels: Record<HomeTab, PanelHandles> | null = null;
  private static bottomNav: ReturnType<typeof createBottomNav> | null = null;
  private static profileHeader: ReturnType<typeof createProfileHeader> | null = null;
  private static unsubscribeScene: (() => void) | null = null;
  private static unsubscribeStore: (() => void) | null = null;

  static init(uiRoot: HTMLElement): void {
    if (HomeUI.mounted) return;

    HomeUI.unsubscribeScene = EventBus.on('scene:changed', ({ id }) => {
      if (id === 'home') {
        HomeUI.mount(uiRoot);
      } else {
        HomeUI.unmount();
      }
    });

    HomeUI.mounted = true;
  }

  static destroy(): void {
    HomeUI.unmount();
    HomeUI.unsubscribeScene?.();
    HomeUI.unsubscribeScene = null;
    HomeUI.mounted = false;
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    HomeUI.destroy();
  }

  static openTab(tab: HomeTab): void {
    if (!HomeUI.root) return;
    HomeUI.setTab(tab);
  }

  static getActiveTab(): HomeTab | null {
    return HomeUI.activeTab;
  }

  private static mount(uiRoot: HTMLElement): void {
    if (HomeUI.root) {
      HomeUI.refreshAll();
      HomeUI.root.hidden = false;
      return;
    }

    const root = document.createElement('div');
    root.className = 'home-ui';
    root.dataset.testid = 'home-ui';

    const profileHeader = createProfileHeader();
    HomeUI.profileHeader = profileHeader;
    root.appendChild(profileHeader.root);

    const panelSheet = document.createElement('div');
    panelSheet.className = 'home-panel-sheet home-ui__interactive';
    const panelInner = document.createElement('div');
    panelInner.className = 'home-panel-sheet__inner';
    panelSheet.appendChild(panelInner);
    root.appendChild(panelSheet);
    HomeUI.panelSheet = panelSheet;
    HomeUI.panelInner = panelInner;

    const panels: Record<HomeTab, PanelHandles> = {
      play: createPlayPanel(),
      inventory: createInventoryPanel(),
      skills: createSkillsPanel(),
      story: createStoryPanel(),
    };
    HomeUI.panels = panels;

    const bottomNav = createBottomNav((tab) => {
      if (HomeUI.activeTab === tab) {
        HomeUI.setTab(null);
        return;
      }
      HomeUI.setTab(tab);
    });
    HomeUI.bottomNav = bottomNav;
    root.appendChild(bottomNav.root);

    uiRoot.appendChild(root);
    HomeUI.root = root;

    HomeUI.unsubscribeStore = gameStore.subscribe(() => {
      HomeUI.refreshAll();
    });

    HomeUI.setTab('play');
  }

  private static unmount(): void {
    if (!HomeUI.root) return;

    HomeUI.unsubscribeStore?.();
    HomeUI.unsubscribeStore = null;

    HomeUI.bottomNav?.destroy();
    HomeUI.bottomNav = null;

    HomeUI.profileHeader?.destroy();
    HomeUI.profileHeader = null;

    if (HomeUI.panels) {
      for (const panel of Object.values(HomeUI.panels)) {
        panel.destroy();
      }
      HomeUI.panels = null;
    }

    HomeUI.panelSheet = null;
    HomeUI.panelInner = null;
    HomeUI.activeTab = null;

    HomeUI.root.remove();
    HomeUI.root = null;
  }

  private static setTab(tab: HomeTab | null): void {
    HomeUI.activeTab = tab;

    if (!HomeUI.panelSheet || !HomeUI.panelInner || !HomeUI.panels || !HomeUI.bottomNav) return;

    HomeUI.panelInner.replaceChildren();

    if (tab) {
      HomeUI.panelSheet.classList.add('home-panel-sheet--open');
      HomeUI.panelInner.appendChild(HomeUI.panels[tab].root);
      HomeUI.bottomNav.setActive(tab);
      HomeUI.panels[tab].refresh();
    } else {
      HomeUI.panelSheet.classList.remove('home-panel-sheet--open');
      HomeUI.bottomNav.setActive(null);
    }
  }

  private static refreshAll(): void {
    HomeUI.profileHeader?.refresh();
    if (HomeUI.activeTab && HomeUI.panels) {
      HomeUI.panels[HomeUI.activeTab].refresh();
    }
  }
}
