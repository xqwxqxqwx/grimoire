import { useSyncExternalStore } from 'react';

/** Маленькие настройки вида — в localStorage; сами записи живут в IndexedDB. */
export interface Settings {
  view: 'grid' | 'rows';
}

const KEY = 'grimoire.settings';
const defaults: Settings = { view: 'grid' };

function load(): Settings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return defaults;
  }
}

let state = load();
const subs = new Set<() => void>();

export function setSettings(patch: Partial<Settings>): void {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* приватный режим — просто не запомним */
  }
  subs.forEach((f) => f());
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
}
