import { create } from 'zustand';
import { TUTORIALS, TutorialData, getTutorialForPath } from '../data/tutorialData';

interface TutorialState {
  activeTutorial: TutorialData | null;
  isOpen: boolean;
  openTutorial: (target: TutorialData | string) => void;
  openTutorialForPath: (pathname: string) => void;
  closeTutorial: () => void;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  activeTutorial: null,
  isOpen: false,

  openTutorial: (target) => {
    if (typeof target === 'string') {
      const found = TUTORIALS[target] || getTutorialForPath(target);
      set({ activeTutorial: found, isOpen: true });
    } else {
      set({ activeTutorial: target, isOpen: true });
    }
  },

  openTutorialForPath: (pathname) => {
    const found = getTutorialForPath(pathname);
    set({ activeTutorial: found, isOpen: true });
  },

  closeTutorial: () => {
    set({ isOpen: false });
  },
}));

export default useTutorialStore;
